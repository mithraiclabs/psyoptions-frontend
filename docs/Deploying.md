## Steps to deploy the frontend app to google cloud

### Development:

The dev instance of the app is automatically deployed when any commits are added to the master branch.

The dev instance url is: https://solana-options-frontend-ckpgwptysa-uc.a.run.app/

You can check if this worked, and determine which commit was last deployed, by looking at the Cloud Build > History page in GCP:
<img src="https://raw.githubusercontent.com/mithraiclabs/solana-options-frontend/master/docs/cloud-build-triggers.png" alt="cloud build history" />
<img src="https://raw.githubusercontent.com/mithraiclabs/solana-options-frontend/master/docs/cloud-build-triggers-2.png" alt="cloud build history details" />

### Production:

Production can be deployed by creating a new release tag in github. To do this, go to the Releases section of the frontend repo. Then click on Draft a New Release:
<img src="https://raw.githubusercontent.com/mithraiclabs/solana-options-frontend/master/docs/draft-new-release.png" alt="draft new release" />

Enter a tag with the pattern `release-x.x.x` where the x'es are numbers (hopefully following semver). IMPORTANT: the tag has to follow this pattern exactly to trigger a production cloud build deploy. And ANY tag that follows this pattern will trigger a production deploy whether it was added from the UI or not.
<img src="https://raw.githubusercontent.com/mithraiclabs/solana-options-frontend/master/docs/new-release.png" alt="new release" />

Publishing the tag will set off the cloud build trigger for production deployment using the tagged commit.

### Confiuring Environment Variables:

In both dev or prod, you can configure the environment variables of the app with the following steps:

1. Go to the Cloud Run page in google cloud and click on the solana-options-frontend cloud run instance:
   <img src="https://raw.githubusercontent.com/mithraiclabs/solana-options-frontend/master/docs/cloud-run-page.png" alt="cloud run page" />

2. From the details page about this cloud run instance, click on Edit & Deploy New Revision:
   <img src="https://raw.githubusercontent.com/mithraiclabs/solana-options-frontend/master/docs/cloud-run-details.png" alt="edit and deploy" />

3. Add / Remove / Change any variables you need to change, then click "Deploy":
   <img src="https://raw.githubusercontent.com/mithraiclabs/solana-options-frontend/master/docs/cloud-run-variables.png" alt="cloud run variables" />

The app will be re-deployed with the updated environment variables, that's it!
