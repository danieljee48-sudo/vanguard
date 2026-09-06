# Google Ads setup

Google Ads tag ID `AW-18382247589` has been added to `app/index.html` alongside the existing GA4 tag.

The account-created event already fires `track(\'account_created\')`; the Google Ads conversion event still needs the conversion label from Google Ads. Once Google Ads creates the conversion action, add its `AW-18382247589/<LABEL>` send_to value to the successful signup path.
