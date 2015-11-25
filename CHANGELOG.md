# Change log

This project adheres to [Semantic Versioning](http://semver.org/). This change
log follows the format outlined at http://keepachangelog.com.

## 0.0.4 - 2015-11-25

### Added

- `setKey` (set key for authentication)
- `apps.create`
- `merchants.update`
- `merchants.users.add`
- `merchants.users.revoke`
- `merchants.users.find`
- `merchants.apps.add`
- `merchants.apps.revoke`
- `merchants.apps.find`
- `merchants.lines.find`

### Changed

- Renamed constructor option `api` to `url`
- Externalized http request logic

### Removed

- `merchants.invite` (replaced by `merchants.users.add`)

### Others

- Upgrade dependencies (Bluebird being the most notable)
- Removed unused dependencies

## 0.0.3 - 2015-10-15 (first working release)

### Changed

- Fixed repository URL in package.json
- Remove license from package.json (we need to research a bit)
