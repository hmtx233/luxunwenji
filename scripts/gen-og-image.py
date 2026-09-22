#!/usr/bin/env python3
"""生成社交分享卡片（og:image），1200x630。

由 scripts/gen-og.mjs 调用，从 stdin 读入 JSON 清单：

    {
      "outDir": "docs/public",
      "items": [
        { "file": "og.png", "title": "鲁迅文集", "kicker": "魯迅",
          "subtitle": "二十三部文集 · 五百七十一篇 · 全文在线阅读" },
        { "file": "og/novels-nahan.png", "title": "《呐喊》", "kicker": "小说",
          "subtitle": "鲁迅 · 十四篇" }
      ]
    }

配色与站点一致：纸白底 + 鲁迅红（favicon 同色 #8B2E2E）。
标题用宋体（书卷气），辅助文字用无衬线。
"""
import io
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAD = 80

PAPER = (250, 247, 242)
INK = (31, 31, 31)
MUTED = (122, 116, 108)
FAINT = (196, 188, 178)
RULE = (226, 219, 209)
RED = (139, 46, 46)
RED_ON = (245, 239, 230)

FONT_CANDIDATES = {
    "song": [
        r"C:\Windows\Fonts\STSONG.TTF",
        r"C:\Windows\Fonts\simsun.ttc",
    ],
    "sans": [
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\Noto Sans SC.ttf",
        r"C:\Windows\Fonts\simhei.ttf",
    ],
    "kai": [
        r"C:\Windows\Fonts\STKAITI.TTF",
    ],
}

_cache = {}


def font(kind, size):
    key = (kind, size)
    if key in _cache:
        return _cache[key]
    for path in FONT_CANDIDATES.get(kind, []):
        if os.path.exists(path):
            f = ImageFont.truetype(path, size)
            _cache[key] = f
            return f
    # 兜底：Pillow 自带位图字体（不支持中文，仅保证脚本不崩）
    f = ImageFont.load_default()
    _cache[key] = f
    return f


def text_width(draw, s, f):
    return draw.textbbox((0, 0), s, font=f)[2]


def draw_tracked(draw, xy, s, f, fill, tracking=0):
    """带字间距的绘制（Pillow 原生不支持 letter-spacing）"""
    x, y = xy
    for ch in s:
        draw.text((x, y), ch, font=f, fill=fill)
        x += text_width(draw, ch, f) + tracking
    return x


def fit_font(draw, s, kind, size, max_width):
    """按最大宽度自动缩字号"""
    while size > 24:
        f = font(kind, size)
        if text_width(draw, s, f) <= max_width:
            return f
        size -= 4
    return font(kind, size)


def rounded(draw, box, r, fill):
    draw.rounded_rectangle(box, radius=r, fill=fill)


def render_icon(item, out_dir):
    """方形应用图标（apple-touch-icon）。iOS 会自己套圆角，故底色铺满、不留圆角。"""
    size = int(item.get("size") or 180)
    img = Image.new("RGB", (size, size), RED)
    draw = ImageDraw.Draw(img)
    f = font("song", int(size * 0.66))
    draw.text((size / 2, size / 2 + size * 0.02), "魯", font=f, fill=RED_ON, anchor="mm")

    path = os.path.join(out_dir, item["file"])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)
    return path


def render(item, out_dir):
    if item.get("type") == "icon":
        return render_icon(item, out_dir)

    img = Image.new("RGB", (W, H), PAPER)

    # 右侧巨大的「魯」水印：低透明度并向右出血，压住画面重心
    mark = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    md = ImageDraw.Draw(mark)
    mark_font = font("song", 480)
    md.text((W - 170, H // 2 - 10), "魯", font=mark_font, fill=RED + (18,), anchor="mm")
    img = Image.alpha_composite(img.convert("RGBA"), mark).convert("RGB")

    draw = ImageDraw.Draw(img)

    # 左上角红色方形标识（与 favicon 同款）
    badge = 92
    rounded(draw, (PAD, PAD, PAD + badge, PAD + badge), 18, RED)
    bf = font("song", 58)
    draw.text((PAD + badge / 2, PAD + badge / 2 - 2), "魯", font=bf, fill=RED_ON, anchor="mm")

    # 徽标右侧的小字分类（如「小说」「学术」）
    kicker = item.get("kicker") or ""
    if kicker:
        kf = font("sans", 28)
        draw_tracked(draw, (PAD + badge + 28, PAD + 32), kicker, kf, MUTED, tracking=6)

    # 主标题
    title = item.get("title") or ""
    tf = fit_font(draw, title, "song", 88, W - PAD * 2 - 200)
    draw.text((PAD, 268), title, font=tf, fill=INK)

    # 副标题
    subtitle = item.get("subtitle") or ""
    if subtitle:
        sf = fit_font(draw, subtitle, "sans", 30, W - PAD * 2 - 120)
        draw.text((PAD, 396), subtitle, font=sf, fill=MUTED)

    # 底部分隔线与站点地址
    draw.line([(PAD, 512), (W - PAD, 512)], fill=RULE, width=2)
    bf2 = font("sans", 24)
    draw.text((PAD, 548), "luxunwenji.com", font=bf2, fill=FAINT)
    tail = "鲁迅作品全文在线阅读"
    draw.text((W - PAD - text_width(draw, tail, bf2), 548), tail, font=bf2, fill=FAINT)

    path = os.path.join(out_dir, item["file"])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)
    return path


def main():
    payload = json.load(sys.stdin)
    out_dir = payload["outDir"]
    saved = []
    for item in payload["items"]:
        saved.append(render(item, out_dir))
    # 回传清单，供调用方打印
    json.dump({"saved": saved}, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
