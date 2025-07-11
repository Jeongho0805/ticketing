import * as util from "./common.js";

function addEventList() {
    // 티켓 예매 이벤트
    const ticket_button = document.getElementById("round-button")
    ticket_button.addEventListener("click", async () => {
        const name = await util.getNickname();
        if (!name) {
            alert("닉네임을 입력해주세요.");
            return
        }

        const timeErrorMessage = "예매 가능 시간이 아닙니다. \n 예매는 매분 00초 부터 30초까지 가능합니다."

        const response = await fetch(`${HOST}/api/order`, {
            method: "POST",
            credentials: 'same-origin',
            headers: {
                "Content-Type": "application/json",
            },
        });
        try {
            if(!response.ok) {
                const data = await response.json();
                if(data.code === "T02") {
                    alert(timeErrorMessage);
                    return;
                }
                throw new Error(data.message);
            }
            activateModalToggle();
            setWaitingOrderSse(name);
        } catch(error) {
            alert("일시적인 서버 장애로 예매에 실패하였습니다.")
        }
    })
}

function updateProgressBar(currentWaiting, totalCapacity) {
    const progressBar = document.getElementById('progress-bar');
    const progress = (totalCapacity - currentWaiting) / totalCapacity;
    progressBar.style.width = progress * 100 + '%';
}

function activateModalToggle() {
    const modal = document.getElementById("modal-section");
    if (modal.style.display === "none" || modal.style.display === "") {
        modal.style.display = "flex";
    } else {
        modal.style.display = "none";
    }
}

function setWaitingOrderSse(name) {
    const eventSource = new EventSource(`${HOST}/api/order`);
    eventSource.addEventListener("waiting-order", (event) => {
        const data = JSON.parse(event.data)
        if (data.isComplete) {
            eventSource.close();
            document.cookie = `permission=reservation; path=/`;
            window.location.href = `${HOST}/reservation`;
            return;
        }
        console.log(event);
        const waiting_number = document.getElementById("waiting-number");
        waiting_number.innerText = data.current_waiting_order;
        updateProgressBar(data.current_waiting_order, data.first_waiting_order);
    });
    eventSource.onerror = (error) => {
        eventSource.close();
        window.location.href = `${HOST}/rank`;
    };
}

async function displayTime() {
    setInterval(async () => {
        const serverTime = await util.getSyncTime();
        const hours = serverTime.getHours().toString().padStart(2, '0');
        const minutes = serverTime.getMinutes().toString().padStart(2, '0');
        const seconds = serverTime.getSeconds().toString().padStart(2, '0');
        const displayElement = document.getElementById('countdown'); // 시간을 표시할 요소 선택
        displayElement.innerText = `${hours}시 ${minutes}분 ${seconds}초`;
        updateColor(seconds);
    }, 100)
}

function updateColor(second) {
    const displayElement = document.getElementById('countdown');
    if (second < 60) {
        displayElement.style.color = "#3CB371"
    }
    if (second >= 50) {
        const normalizedValue = Math.min(Math.max((second - 50) / 10, 0), 1);

        const green = Math.floor(100 * (1 - normalizedValue));
        const blue = Math.floor(100 * (1 - normalizedValue));
        const color = `rgb(255, ${green}, ${blue})`;

        displayElement.style.color = color;
    }
    if (second < 50 && second >= 30) {
        displayElement.style.color = "darkslateblue"
    }
}

//todo 시간 확인을 위한 임시 처리
async function checkServerTime() {
    const synTime = getSyncDate();
    const synTimeInfo = `${synTime.getHours()}:${synTime.getMinutes()}:${synTime.getSeconds()}.${synTime.getMilliseconds()}`

    const deviceTime = new Date();
    const deviceTimeInfo = `${deviceTime.getHours()}:${deviceTime.getMinutes()}:${deviceTime.getSeconds()}.${deviceTime.getMilliseconds()}`

    const response = await fetch(`${HOST}/api/server-time`);
    const data = await response.json();
    const serverDate = new Date(data.server_time);
    const serverDateInfo = `${serverDate.getHours()}:${serverDate.getMinutes()}:${serverDate.getSeconds()}.${serverDate.getMilliseconds()}`

    const displayElement = document.getElementById('countdown'); // 시간을 표시할 요소 선택

    console.log(
        `보정시간=${synTimeInfo} \n기기시간=${deviceTimeInfo}\n서버시간-${serverDateInfo}\n표시시간=${displayElement.innerText}\n차이=${serverOffset}`
    );
}

window.addEventListener("pageshow", async (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

addEventList();
displayTime();

