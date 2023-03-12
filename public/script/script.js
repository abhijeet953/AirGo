const hourHand = document.getElementById('hour-hand');
const minuteHand = document.getElementById('minute-hand');
const secondHand = document.getElementById('second-hand');

function rotateHands() {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondsAngle = (seconds / 60) * 360;
  const minutesAngle = ((minutes + seconds / 60) / 60) * 360;
  const hoursAngle = ((hours + minutes / 60) / 12) * 360;

  secondHand.style.transform = `rotate(${secondsAngle}deg)`;
  minuteHand.style.transform = `rotate(${minutesAngle}deg)`;
  hourHand.style.transform = `rotate(${hoursAngle}deg)`;
}

rotateHands();
setInterval(rotateHands, 1000);

