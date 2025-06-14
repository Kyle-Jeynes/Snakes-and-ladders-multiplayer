export function getPlayer() {
    if (localStorage.getItem('player')) {
        return JSON.parse(localStorage.getItem('player'));
    }

    return null;
};