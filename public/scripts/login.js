$(document).ready(() => {
    $('#loginButton').click(async () => {
        $("#status-container").css("display", "block");
        let dot = 0;
        const connect_msg = setInterval(() => {
            if (dot == 4) dot = 0;
            $('#connection-status').text('Đang xác thực' + Array(dot + 1).join('.'));
            dot ++;
        }, 200);
        const public_key = $('#publicInput').val();
        const private_key = $('#privateInput').val();
        fetch('/login/', {
            credentials: 'include',
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'private_key': private_key, 'public_key': public_key })
        }).then(async (response) => {
            if (!response.ok) return false;
            const res = await response.json();
            console.log(res);
            clearInterval(connect_msg);
            if (res.success) {
                $('#connection-status').css('color', '#009944');
                $('#connection-status').text('XÁC THỰC THÀNH CÔNG!');
                window.location.href = "/"
            }
            else {
                $('#connection-status').css('color', '#CF000F');
                $('#connection-status').text('XÁC THỰC THẤT BẠI!');
            }
        });
            // $.post('/login', { 'private_key': private_key, 'public_key': public_key }, async (res) => {
            //     clearInterval(connect_msg);
            //     if (res.success) {
            //         $('#connection-status').css('color', '#009944');
            //         $('#connection-status').text('XÁC THỰC THÀNH CÔNG!');
            //         await delay(2000);
            //         window.location.href = "/"
            //     }
            //     else {
            //         $('#connection-status').css('color', '#CF000F');
            //         $('#connection-status').text('XÁC THỰC THẤT BẠI!');
            //     }
            // })
    })
})