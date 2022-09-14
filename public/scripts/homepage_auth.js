$(document).ready(() => {
    $('#homeNav').addClass('active');
    
    const get_balance = () => {
        $.get('/api/balance', (res) => {
            $("#balance").text(res.orc);
        })
    }
    get_balance();
    $("#reloadBalanceButton").click(() => {
        get_balance();
    })
    $.get('http://ip-api.com/json/', (res) => {
        $('#ip').text(res.query);
    })
});