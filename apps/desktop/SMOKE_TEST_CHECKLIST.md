# Desktop Smoke Test Checklist

Target platforms:
- Windows 10/11 (x64)
- macOS (Intel + Apple Silicon)

## Pre-checks
- Installer artifact exists in `apps/desktop/release`
- App installs successfully
- App launches without crash

## Functional checks
- Authentication works (sign in and sign out)
- New chat can be created
- Message send/receive works
- Screenshot attachment works
- File attachment upload and deletion works

## Billing checks
- Free user sees `Upgrade to Plus`
- Paid user sees `Manage Subscription`
- Checkout opens in external browser
- Billing portal opens in external browser
- Returning to app refreshes usage and plan state

## Desktop behavior checks
- Window pin/unpin works
- Minimize works
- App reopen after close works
- Device identity persists after restart

## Teardown checks
- App closes cleanly
- App uninstalls cleanly
