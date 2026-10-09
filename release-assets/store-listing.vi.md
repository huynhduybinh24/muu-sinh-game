# Store listing — DRAFT / NEEDS OWNER APPROVAL

Developer: Muu Sinh Studio. Branding Task 22C is NOT officially approved.
No store app, submission, policy publication or upload has been created.

## Title

Mưu Sinh – Mỗi Ngày Một Nghề

## Short description

Khám phá 26 nghề, kiếm tiền trong game và xây cuộc sống ở phố nhỏ Việt Nam

## Full description

Mỗi ngày một nghề, mỗi ca làm một câu chuyện. MƯU SINH đưa bạn đến phố nhỏ Việt Nam, nơi bạn tạo nhân vật và trải nghiệm 26 công việc qua những mini-game ngắn.

Bán nước mía, phụ hồ, giao hàng, cắt tóc, pha cà phê, đánh cá, chụp ảnh, lập trình và nhiều nghề khác. Chạm, kéo, điều hướng hoặc chọn đúng thời điểm để hoàn thành công việc. Mỗi ca có 45 giây chơi, không tính thời gian hướng dẫn và tạm dừng.

Khám phá thị trấn và chơi các nghề bạn thích. Kiếm tiền và XP trong game, hoàn thành nhiệm vụ ngày, nhận thành tựu và phát triển nhân vật. Mua trang phục, phụ kiện, thiết bị và phương tiện bằng tiền trong game; ghé gara hoặc trang trí phòng riêng.

Game có 26 nghề, 100 món đồ cửa hàng và 46 thành tựu. Tạo ảnh PNG kết quả để tự lưu hoặc chia sẻ. Xuất bản sao JSON và nhập lại để chuyển tiến trình giữa các môi trường lưu trữ.

Bản Android dùng tài nguyên đóng gói để chơi offline. Tiến trình lưu trên thiết bị; không có tài khoản, máy chủ lưu game, quảng cáo hoặc mua hàng bằng tiền thật. Tiến trình web không tự chuyển vào Android. Hãy sao lưu JSON trước khi đổi thiết bị hoặc đổi bản cài đặt.

Giao diện tiếng Việt, thiết kế ưu tiên màn hình dọc và điều khiển cảm ứng. Các công việc là mô phỏng giải trí, không thay thế hướng dẫn nghề nghiệp ngoài đời.

## Release notes — vi-VN

Bản thử nghiệm đầu tiên: 26 nghề chơi ngắn, thị trấn, nhân vật, cửa hàng, gara, phòng riêng, nhiệm vụ ngày, thành tựu, ảnh kết quả và sao lưu JSON. Bản Android hỗ trợ chơi offline bằng tài nguyên đóng gói.

## Device notes

Android 7.0 / API 24 or later; target/compile API 36. Portrait phone gameplay,
touch controls; keyboard not required. A current Android System WebView and
functional Canvas/WebGL are needed. Tablet/foldable/16KB-device usability and
low-end performance are NOT yet verified. No Wear OS/TV/Automotive/XR promises.
Physical Android screenshots and measurements remain a release gate.

## Asset inventory and provenance

- `app-icon.png`: 512×512, original emblem on full square background, PNG alpha;
  Play applies its own mask. `app-icon.svg` is editable source.
- `feature-graphic.jpg`: 1024×500, no alpha, existing original town art and logo;
  `feature-graphic.svg` is editable source. Alt: “Mưu Sinh, mỗi ngày một nghề
  trong phố nhỏ Việt Nam”.
- `screenshots/*.jpg`: genuine production browser UI, 1080×1920, JPEG, no frame,
  overlays or fabricated gameplay. See `capture-provenance.json` for exact
  screen/alt text. Isolated new QA profile, no developer save changed. These are
  NOT physical Android screenshots; replace/approve after real-device QA.
- Draft content policy is `privacy-policy-draft.md`, generated from the same
  source as the in-app disclosure; no email/URL has been invented.

Review current [Google Play assets guidance](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)
before upload. Title ≤30 characters, short description ≤80, full description
≤4000. Phone screenshots meet the 9:16 recommendation; draft package provides
seven authentic screens. No ranking, price, store badges or third-party art.
