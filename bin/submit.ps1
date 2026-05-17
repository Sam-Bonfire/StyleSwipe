# --no-edit: Use commit messages for PR titles
# --submit: Create PRs if they don't exist
# --publish: Push branches to remote
gt submit --stack --no-edit --publish

Write-Host "✅ PRs live on GitHub targeting 'dev'."
