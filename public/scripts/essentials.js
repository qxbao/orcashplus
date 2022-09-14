const delay = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
}

const socket = io();