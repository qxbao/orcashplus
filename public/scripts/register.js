/* eslint-disable no-undef */
$(document).ready(() => {
    $('#confirmButton').click(async () => {
        $('body').css('background', 'black');
        await $('#registerCard').fadeOut(1000).promise();
        await $('#walletCard').fadeIn(1000).promise();
        $.post('/createwallet', (res) => {
            const priv = res.private_key;
            const pub = res.public_key;
            const keypair =
            `<p>Public key:</p>
            <div class="input-group mb-3">
                <input class="form-control rounded-0 font-code" disabled value="${pub}">
                <button class = "btn btn-outline-success rounded-0" onclick="navigator.clipboard.writeText('${pub}')">Copy</button>
            </div>
            <p>Private key:</p>
            <div class="input-group mb-3">
                <input class="form-control rounded-0 font-code" disabled value="${priv}">
                <button class = "btn btn-outline-success rounded-0" onclick="navigator.clipboard.writeText('${priv}')">Copy</button>
            </div>
            <small class='text-danger'>Hãy đảm bảo rằng bạn đã lưu lại cả 2 khóa vào một nơi an toàn.</small>`;
            $('#walletCard .card-body').html(keypair);
        }, 'json')
    })
})