# Release Notes for meumobi

## Update Release Notes
### Get Resume of changes commits
Update these notes using: git log --pretty=format:'* %s' --no-merges v2.6.3..HEAD

#### Commit Release Notes
Use Resume of Changes from previous command on commit message

1. $ git add RELEASENOTES.md 
2. $ git commit 

### Tag and Push Release

1. $ git tag v2.6.4
2. $ git push origin v2.6.4 

<a name="v0.0.7"></a>
# [v0.0.7](https://github.com/meumobi/ng-meumobi-utils/compare/v0.0.6...v0.0.7)
* ENHANCE: add 'video/mp4' file type and few coding style improvements

<a name="v0.0.6"></a>
# [v0.0.6](https://github.com/meumobi/ng-meumobi-utils/compare/v0.0.5...v0.0.6)
* FIX: Analytics should return promise for App AND browser
* ENHANCE: add configurable timeout on http request

<a name="v0.0.5"></a>
# [v0.0.5](https://github.com/meumobi/ng-meumobi-utils/compare/v0.0.4...v0.0.5)

* ENHANCE: Add new methode for push, sendTag and setSubscription
* UPGRADE: Closes #9, google-analytics-plugin upgrade

<a name="v0.0.4"></a>
# [v0.0.4](https://github.com/meumobi/ng-meumobi-utils/compare/v0.0.3...v0.0.4)

* FEATURE: Add Cordova SplashScreen and SpinnerDialog Support
* FEATURE: Add lib to connect to meumobi API meuCloud.API
* ENHANCE: Re-organize libs Cordova, Utils, Cloud

<a name="v0.0.3"></a>
# [v0.0.3](https://github.com/meumobi/ng-meumobi-utils/compare/v0.0.2...v0.0.3)

* FEATURE: Closes #10, add Device Service
* ENHANCE: Only use plugin to phoneCall if exists
* TOOLS: update eslint rules

<a name="v0.0.2"></a>
# [v0.0.2](https://github.com/meumobi/ng-meumobi-utils/compare/v0.0.1...v0.0.2)

* FEATURES: Add push Services for onesignal and pushwoosh providers

<a name="v0.0.1"></a>
# [v0.0.1](https://github.com/meumobi/ng-meumobi-utils/compare/v0.0.0...v0.0.1)

* FEATURES: Add meuPhoneCall Service
