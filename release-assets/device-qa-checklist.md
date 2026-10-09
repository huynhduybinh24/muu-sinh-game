# Task 24 physical Android acceptance — BLOCKED, NOT EXECUTED

`adb devices -l` currently lists no device. Browser automation, bridge mocks,
Gradle builds and desktop stopwatch results are NOT physical Android acceptance.
No install, uninstall, clear-data, reset or force-stop was performed on user data.

## Preparation and evidence

- [ ] Connect phone/enable USB debugging; authorize this PC. Record device model,
  Android/API, WebView version, RAM, refresh rate, app versionCode and install source.
- [ ] Export and verify JSON backup BEFORE installation/signature changes. Do not
  uninstall a differently signed debug app or clear data to bypass install failure.
  Get owner migration approval; web/Android stores never auto-transfer.
- [ ] Use a compatible-signed update, or Play-installed internal-test build after
  owner upload. Record installed certificate/build SHA. Upload key and distributed
  app-signing key may differ. No broad file/storage permissions needed.
- [ ] Capture only consented app screenshots/logs, keep private saves/names out of
  public bug reports. Store local QA outputs under ignored `qa-artifacts/`.

## Every profession — touch, timer, score, replay, Back

Each checkbox requires: actual touch interaction with a successful action and a
miss, appropriate score/combo, 45s ACTIVE timer (exclude tutorial, explicit pauses,
end overlay), one result, working replay, no stuck drag/D-pad after interruption.
Record active wall time, displayed game time, pause/focus intervals and boot/end
overhead separately. Test Back pauses before leaving; cancel/resume preserves time.

- [ ] sugarcane — Bán nước mía
- [ ] construction — Phụ hồ
- [ ] shipper — Shipper
- [ ] noodle — Bán hủ tiếu
- [ ] barber — Cắt tóc
- [ ] carwash — Rửa xe
- [ ] rubber — Cạo cao su
- [ ] mechanic — Sửa xe
- [ ] coffee — Pha cà phê
- [ ] fishing — Đánh cá
- [ ] banhmi — Bán bánh mì
- [ ] gas — Đổ xăng
- [ ] cargo — Bốc hàng
- [ ] cleaning — Quét đường
- [ ] electrician — Thợ điện
- [ ] florist — Bán hoa
- [ ] security — Bảo vệ
- [ ] photographer — Chụp ảnh
- [ ] cashier — Thu ngân
- [ ] harvest — Thu hoạch trái cây
- [ ] it — Lập trình viên
- [ ] accountant — Kế toán
- [ ] police — Công an
- [ ] doctor — Bác sĩ
- [ ] teacher — Giáo viên
- [ ] taxi — Tài xế

## Native file/storage/display acceptance

- [ ] Cold launch and airplane-mode launch; profile and privacy HTML open offline.
  Link behavior/return from policy tab must be checked in actual WebView.
- [ ] Restart after owner-approved force-stop (NOT clear-data): profile, money,
  XP, inventory, gear, 46 achievements and daily claim state remain unchanged.
- [ ] Town 26 locations; Shop 100 products purchase/equip/preview cancel; Garage
  and My Room preserve ownership, do not grant rewards on navigation.
- [ ] Share PNG into a second real app and OPEN it there (1080×1350), save via
  Android document picker, cancel both flows without unexpected file/save changes.
- [ ] Export JSON, inspect privately, import via picker with confirmation, compare
  restored save v5. Test malformed file and cancellation keep original save intact.
- [ ] Native pause/resume via background, screen lock and app switching; Back in
  Home/Profile/edit/dialog/game; no duplicate canvas/listener/result after replay.
- [ ] Portrait/safe areas/status/navigation bars; Android 16 predictive gesture
  Back AND 3-button Back, IME resize/dismissal; 44px targets, no hidden controls.
- [ ] Adaptive masks/themed icon/splash/Home in light/night; approved branding
  screenshots must come from actual device, not relabeled browser screenshots.
- [ ] Modest phone and Android 16/16KB environment: cold-start, FPS/frame stalls,
  20+ replays/long session memory and app-specific crash/ANR evidence. No invented
  FPS/RAM guarantee; OS WebView libraries are outside this app bundle.

Result record: date/device/build/job or screen/steps/expected/actual/evidence;
mark each PASS/FAIL/BLOCKED individually. Empty checkboxes are not passes.
