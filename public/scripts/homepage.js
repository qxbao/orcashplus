/* eslint-disable no-undef */
$(document).ready(() => {
    const typing = async (arr) => {
        setInterval(() => {
            $('#pointer').text($('#pointer').text() == "" ? "|" : "");
        }, 500);
        let wrote = "";
        for (let paragraph of arr){
            wrote += "> "
            for (let i = 0; i < paragraph.length; i++) {
                wrote += paragraph[i];
                $('#info-container').html(wrote);
                await delay(60);
            }
            wrote += "<br>";
            await delay(400);
        }
    }
    let node_quantity;
    socket.emit("check node");
    socket.on("node quantity", (quantity) => {
        node_quantity = quantity;
        typing(["Webapp version: Beta1.0.0", "Số block đã được đào: 3847 Block", "Phần thưởng hiện tại: 23 ORC/Block", "Độ khó: 5", "Thợ mỏ đã tham gia: 223", `Thợ mỏ đang hoạt động: ${node_quantity}`, "@orca"]);
    })

});