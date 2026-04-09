Use small, vertical commits.

Aim for one meaningful unit per commit, not literally one file per commit
A good commit can touch 2-5 files if they all belong to the same feature slice
“One file per commit” often creates noisy history and broken intermediate states
Better rule: each commit should be reviewable, coherent, and ideally runnable
Good minimal push cycle:

chore: add project plan and env scaffolding
feat: scaffold interview screener app shell
feat: add audio upload or recording input
feat: add transcription endpoint
feat: add tutor evaluation pipeline
feat: render structured assessment report
fix: handle empty uploads and api failures
style: polish interview flow and loading states
docs: add setup and env instructions
What “clean history” looks like:

each commit has one purpose
commit message explains why, not just what
no mixed commits like UI + refactor + docs + bugfix together
avoid “wip”, “temp”, “misc fixes”, “final changes”
For your challenge, a strong pattern is:

docs/chore commit for setup
feat commits for each product slice
fix commits for edge cases
one final docs commit for README/submission polish
Push cadence:

commit whenever a slice is complete
push after 1-3 commits, or whenever you reach a safe checkpoint
no need to push every single commit instantly unless you want backup
