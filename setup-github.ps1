# One-time setup: initialize git and publish UpLift to GitHub as a public repo.
# Run from the UpLift folder:  .\setup-github.ps1
# (Requires the GitHub CLI: https://cli.github.com — run `gh auth login` first if needed.)
# Safe to delete this file afterwards.

git init
git add .
git commit -m "Initial scaffold: Expo app with gamification engine, caching layers, and Supabase schema"
gh repo create UpLift --public --source=. --push
