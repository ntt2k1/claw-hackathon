# Prompt DNA Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the LLM prompt in `search_and_plan` to be fully English, output Vietnamese text, remove date/season, replace `AXIS_VI` with `AXIS_EN`, and inject DNA-aware hard-block and signature rules from the SOLE DNA spec.

**Architecture:** All changes are in `backend/agent/tools.py`. No other files touched. Changes are: (1) delete dead date code; (2) add Vietnamese output instruction to system prompt; (3) replace `AXIS_VI` with `AXIS_EN` and simplify `axes_context`; (4) add `SIGNATURE_RULES` dict and compute `hard_block_line` / `signature_line` from the `axes` scores at runtime.

**Tech Stack:** Python 3.12, LangChain `ChatPromptTemplate`.

---

## Files

| Action | File |
|--------|------|
| Modify | `backend/agent/tools.py` |

---

### Task 1: Remove date/season code and add Vietnamese output instruction

**Files:**
- Modify: `backend/agent/tools.py`

- [ ] **Step 1: Remove `from datetime import datetime` import**

Line 7 currently reads:
```python
from datetime import datetime
```

Delete that line entirely. The `os` import on line 6 stays.

- [ ] **Step 2: Delete the `_vietnam_season` function**

Delete lines 11–19 (the entire `_vietnam_season` function):
```python
def _vietnam_season(month: int) -> str:
    if month in (12, 1, 2):
        return "Dry/Cool season"
    elif month in (3, 4, 5):
        return "Hot season"
    elif month in (6, 7, 8):
        return "Rainy season"
    else:  # 9, 10, 11
        return "Dry/Cool season"
```

- [ ] **Step 3: Delete the three `date_line` lines inside `search_and_plan`**

Find and delete these three consecutive lines (currently around lines 128–130):
```python
    now = datetime.now()
    season = _vietnam_season(now.month)
    date_line = f"\nCurrent date: {now.strftime('%A, %B %d, %Y')} ({season})"
```

- [ ] **Step 4: Remove `{date_line}` from the Human message template**

Find this line in the Human message template:
```
{date_line}
```
Delete it. The surrounding lines before and after stay:
```
{budget_line}
{avoid_line}
Duration: {duration} {unit}
```

- [ ] **Step 5: Remove `"date_line": date_line` from `invoke_vars`**

Find and delete this line from the `invoke_vars` dict:
```python
        "date_line": date_line,
```

- [ ] **Step 6: Add Vietnamese output instruction to the System message**

Find the end of the System message (the line that currently reads):
```python
Output: valid JSON object only, no markdown, no explanation."""),
```

Replace it with:
```python
Output: valid JSON object only, no markdown, no explanation.
All descriptive text fields in the JSON output (description, why_match, tip) MUST be written in Vietnamese. Place names and addresses keep their original form."""),
```

- [ ] **Step 7: Verify syntax**

```bash
cd /Users/lap14972/Source/github.com/ntt2k1/claw-hackathon
python3 -m py_compile backend/agent/tools.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 8: Commit**

```bash
git add backend/agent/tools.py
git commit -m "feat: remove date/season, add Vietnamese output instruction to prompt"
```

---

### Task 2: Replace AXIS_VI with AXIS_EN and inject DNA hard-block + signature rules

**Files:**
- Modify: `backend/agent/tools.py`

- [ ] **Step 1: Delete `AXIS_VI` and insert `AXIS_EN` + `SIGNATURE_RULES` in its place**

Find and delete the entire `AXIS_VI` dict (currently lines 73–84):
```python
AXIS_VI = {
    "Ẩm thực": "ăn uống local chất lượng",
    "Văn hoá": "văn hoá lịch sử kiến trúc",
    "Thiên nhiên": "thiên nhiên không gian xanh",
    "Phiêu lưu": "hoạt động phiêu lưu thử thách",
    "Sang chảnh": "không gian sang trọng dịch vụ cao cấp",
    "Giao lưu": "không khí sôi động giao lưu kết nối",
    "Tọa độ ngách": "địa điểm ít người biết tọa độ ẩn",
    "Thư giãn": "không gian yên tĩnh nghỉ ngơi thư giãn",
    "Nhiếp ảnh": "góc đẹp ánh sáng tốt photogenic",
    "Hiệu quả": "lịch trình tối ưu tiết kiệm thời gian",
}
```

Insert in its place:
```python
AXIS_EN = {
    "Ẩm thực":      "Food",
    "Văn hoá":      "Culture",
    "Thiên nhiên":  "Nature",
    "Phiêu lưu":    "Adventure",
    "Sang chảnh":   "Luxury",
    "Giao lưu":     "Social",
    "Tọa độ ngách": "HiddenGem",
    "Thư giãn":     "Comfort",
    "Nhiếp ảnh":    "Photography",
    "Hiệu quả":     "Efficiency",
}

SIGNATURE_RULES = {
    "Ẩm thực":      "25–40% of itinerary stops must be food or dining experiences",
    "Tọa độ ngách": "minimize tourist landmarks; prioritize hidden local spots, unmarked alleys, neighborhood-only venues",
    "Thư giãn":     "cap at 3 activities total; no spots scheduled before 8 AM; prefer slow-paced venues",
    "Hiệu quả":     "cluster all spots geographically to minimize travel time between stops",
    "Nhiếp ảnh":    "prioritize spots with natural light, minimalist or aesthetic interiors, photogenic architecture",
    "Giao lưu":     "include at least one evening/nightlife spot scheduled after 8 PM",
    "Sang chảnh":   "prefer premium or boutique venues; avoid budget options",
    "Thiên nhiên":  "prioritize parks, green spaces, outdoor venues over indoor spots",
    "Văn hoá":      "include heritage sites, museums, or historical neighborhoods",
    "Phiêu lưu":    "include at least one active outdoor or physically engaging activity",
}
```

- [ ] **Step 2: Update `axes_context` to use `AXIS_EN`, remove descriptions**

Find the current `axes_context` computation inside `search_and_plan()`:
```python
    axes_context = "\n".join(
        f"- {axis} ({score}%): {AXIS_VI.get(axis, axis)}"
        for axis, score in top3
    )
```

Replace with:
```python
    axes_context = "\n".join(
        f"- {AXIS_EN.get(axis, axis)} ({score}%)"
        for axis, score in top3
    )
```

- [ ] **Step 3: Add hard-block and signature computation after `avoid_line`**

Find the `avoid_line` block (currently ending with `avoid_line = ""`). Directly after that block, insert:

```python
    hard_blocks = [AXIS_EN.get(ax, ax) for ax, sc in axes.items() if sc < 20]
    if hard_blocks:
        hard_block_line = "\nHARD BLOCK — never suggest places primarily associated with: " + ", ".join(hard_blocks)
    else:
        hard_block_line = ""

    signatures = [(AXIS_EN.get(ax, ax), ax) for ax, sc in axes.items() if sc > 80]
    if signatures:
        rules = [SIGNATURE_RULES[vi] for _, vi in signatures if vi in SIGNATURE_RULES]
        signature_line = "\nSIGNATURE traits — apply these rules strictly:\n" + "\n".join(f"- {r}" for r in rules)
    else:
        signature_line = ""
```

- [ ] **Step 4: Add `{hard_block_line}` and `{signature_line}` to the Human message template**

Find the Human message section:
```
{avoid_line}
Duration: {duration} {unit}
```

Replace with:
```
{avoid_line}
{hard_block_line}
{signature_line}
Duration: {duration} {unit}
```

- [ ] **Step 5: Add `hard_block_line` and `signature_line` to `invoke_vars`**

Find the `invoke_vars` dict. After `"avoid_line": avoid_line,`, add:
```python
        "hard_block_line": hard_block_line,
        "signature_line": signature_line,
```

The full `invoke_vars` dict should now be:
```python
    invoke_vars = {
        "persona": persona,
        "axes_context": axes_context,
        "location": location,
        "trip_type": "day trip" if trip_type == "inday" else "multi-day trip",
        "duration": duration,
        "unit": "hours" if trip_type == "inday" else "days",
        "place_type_hint": place_type_hint,
        "need_line": need_line,
        "budget_line": budget_line,
        "avoid_line": avoid_line,
        "hard_block_line": hard_block_line,
        "signature_line": signature_line,
    }
```

- [ ] **Step 6: Verify syntax**

```bash
python3 -m py_compile backend/agent/tools.py && echo "OK"
```

Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add backend/agent/tools.py
git commit -m "feat: replace AXIS_VI with AXIS_EN, inject DNA hard-block and signature rules into prompt"
```
