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

const images = [
	'images/bg0.jpg',
	'images/bg1.jpg',
	'images/bg2.jpg',
	'images/bg3.jpg',
	'images/bg4.jpg',
	'images/bg5.jpg',
	'images/bg6.jpg',
	'images/bg7.jpg',
	'images/bg8.jpg',
	'images/bg9.jpg',
	'images/bg10.jpg',
	'images/bg11.jpg',
	'images/bg12.jpg',
	'images/bg13.jpg',
	'images/bg14.jpg',
	'images/bg15.jpg',
	'images/bg16.jpg',
	'images/bg17.jpg'
];

const chosenImage = images[Math.floor(Math.random() * images.length)];
document.body.style.backgroundImage = `url(${chosenImage})`;



