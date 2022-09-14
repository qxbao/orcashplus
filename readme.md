# Orcash+
Đây là source code của dự án Nodejs open-source Orcash+ - tự phát hành một Cryptocurrency (ORC) được phát triển dưới dạng 1 webapp.

## Giới thiệu
Dự án được phát triển nhằm cung cấp kiến thức về block chain cho những ai muốn tìm hiểu. Hầu hết tính năng của một hệ thống phân tán đều đã được xây dựng (1 số không thể do giới hạn về kỹ thuật cũng như số lượng node tham gia).

- Mạng Peer-to-Peer: Sử dụng library [Socket.io](https://www.npmjs.com/package/socket.io)
- Template engine: Pug/Jade

## Yêu cầu
- Cài đặt sẵn môi trường Nodejs và MySQL, tạo một file .env ở thư mục gốc và config như sau

        DBHOST = "HOST DB (localhost hay gì tùy bạn)"
        DBUSER = "Tên đăng nhập DB"
        DBPWD = "Mật khẩu DB"
        DBNAME = "Tên DB"
        PASSPHRASE = "Một chuỗi ngẫu nhiên (tạo keypair)"
        SECRET_STR = "Vẫn là một chuỗi ngẫu nhiên (gen session)"
        MINE_ADDRESS = "Địa chỉ ví chủ, đặt gì cũng được"

- Trỏ command prompt về cloned folder, cài đặt tất cả lib cần thiết

        npm install
## Chi tiết
Xem thêm tại page "Tài liệu" trên web sau khi chạy server.

## Hình ảnh
Một số hình ảnh thực tiễn về UI/UX nhà làm
![ảnh 1](https://i.ibb.co/TwLG9Pg/image.png)
![ảnh 2](https://i.ibb.co/jzrzyMn/image.png)
![ảnh 3](https://i.ibb.co/1rXswNt/image.png)