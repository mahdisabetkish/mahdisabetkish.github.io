#!/usr/bin/env python3
"""Regenerate the auto-populated part of the Projects section from the
public repositories on github.com/mahdisabetkish, so a new (or updated)
public repo shows up on the site without any manual edit.

Repos that already have a hand-written card above the markers are left
alone — this only fills in the block between the AUTO-PROJECTS markers.
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

USERNAME = "mahdisabetkish"
SITE_FILE = Path(__file__).resolve().parent.parent / "index.html"
START_MARKER = "<!-- AUTO-PROJECTS:START -->"
END_MARKER = "<!-- AUTO-PROJECTS:END -->"

# Repos with a hand-written card already in index.html (above the markers).
CURATED_REPOS = {
    "family-homelessness-early-warning",
    "parsimony",
    "histology-omics-fusion",
    "tcga-cancer-type-classifier",
    "bayesian-survival-metabric",
    "afa-ssl",
    "vision2words",
    "barlow-twins-cifar10",
    "self-supervised-simclr",
}

# Repos that should never appear as a project card.
SKIP_REPOS = {
    f"{USERNAME}.github.io",
}

TAG_RULES = [
    (("self-supervised", "ssl", "contrastive", "simclr", "barlow-twins", "jepa"), "ssl"),
    (("genomic", "rna-seq", "cancer", "biology", "metabric", "tcga", "omics", "histology"), "computational-biology"),
    (("reinforcement-learning", "rl", "dqn", "ppo"), "reinforcement-learning"),
    (("vision", "image", "cv", "cnn"), "computer-vision"),
]


def pick_tag(topics, language):
    haystack = " ".join(topics + ([language] if language else [])).lower()
    for keywords, tag in TAG_RULES:
        if any(k in haystack for k in keywords):
            return tag
    return "applied-ml"


def humanize(name):
    words = re.split(r"[-_]+", name)
    return " ".join(w if w.isupper() else w.capitalize() for w in words)


def fetch_repos():
    req = urllib.request.Request(
        f"https://api.github.com/users/{USERNAME}/repos?per_page=100&type=public",
        headers={"Accept": "application/vnd.github.v3+json", "User-Agent": USERNAME},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def build_card(repo):
    name = repo["name"]
    tag = pick_tag(repo.get("topics") or [], repo.get("language"))
    desc = (repo.get("description") or "").strip()
    if not desc:
        desc = "Public repository — see the code for details."
    tag_chips = "".join(
        f'<span class="tag">{t}</span>'
        for t in ((repo.get("topics") or [])[:3] or ([repo["language"]] if repo.get("language") else []))
    )
    links = [f'<a href="{repo["html_url"]}" target="_blank" rel="noopener">Code</a>']
    if repo.get("homepage"):
        links.insert(
            0,
            f'<a href="{repo["homepage"]}" target="_blank" rel="noopener">Live demo →</a>',
        )
    return (
        f'        <div class="project-card" data-tags="{tag}">\n'
        f"          <h3>{humanize(name)}</h3>\n"
        f'          <p class="desc">{desc}</p>\n'
        f'          <div class="tag-row">{tag_chips}</div>\n'
        f'          <div class="card-links">\n            {chr(10).join("            " + l for l in links).strip()}\n          </div>\n'
        f"        </div>"
    )


def main():
    repos = fetch_repos()
    repos = [
        r
        for r in repos
        if not r.get("fork")
        and not r.get("archived")
        and r["name"].lower() not in CURATED_REPOS
        and r["name"].lower() not in SKIP_REPOS
        and not r.get("private")
    ]
    repos.sort(key=lambda r: r.get("pushed_at") or "", reverse=True)

    cards = "\n\n".join(build_card(r) for r in repos)
    block = f"{START_MARKER}\n{cards}\n        {END_MARKER}" if cards else f"{START_MARKER}\n        {END_MARKER}"

    html = SITE_FILE.read_text(encoding="utf-8")
    pattern = re.compile(
        re.escape(START_MARKER) + r".*?" + re.escape(END_MARKER), re.DOTALL
    )
    if not pattern.search(html):
        print("Markers not found in index.html", file=sys.stderr)
        sys.exit(1)

    new_html = pattern.sub(block, html)
    SITE_FILE.write_text(new_html, encoding="utf-8")


if __name__ == "__main__":
    main()
