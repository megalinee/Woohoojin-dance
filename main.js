import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// banana settings
let jumpDistance = 1;
let bananaSpeed = 2
let bananaRotationYOffset = 1.2; // radians
let bookCount = 1;
let bookRotationRadius = 4;
let bookYOffset = -1;
let backgroundColor = "#ff8833"

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 10;


const light = new THREE.AmbientLight("0xffffff", .8)
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
directionalLight.position.x = camera.position.x;
directionalLight.position.y = camera.position.y;
directionalLight.position.z = camera.position.z;

// audio
const hoojsong = 'music/hoojmusic.mp3'

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.PositionalAudio(listener);
const analyser = new THREE.AudioAnalyser(sound);
const audioLoader = new THREE.AudioLoader();

document.getElementById('start').innerHTML = 'LOADING MUSIC...'
audioLoader.load(hoojsong, function (buffer) {
    sound.setBuffer(buffer);
    sound.setRefDistance(50);
    sound.setLoop(false);
    sound.setVolume(0.5);
    sound.setLoop(true);
    document.getElementById('start').innerHTML = 'CLICK TO PLAY MUSIC'
    jQuery("#start").on('click tap touchstart', function () {
        console.log('Playback resumed successfully');
        sound.play();
        document.getElementById('start').innerHTML = ''
    });


});

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 32) {
        if (sound.isPlaying) {
            document.getElementById('start').innerHTML = 'PAUSED'
            sound.pause();
        } else {
            document.getElementById('start').innerHTML = ''
            sound.play();
        }
    }
}

// load assets

const loader = new GLTFLoader();

let banana = null;

loader.load('assets/NEWBANAAN.glb', function (bananaGLTF) {
    banana = bananaGLTF.scene
    banana.rotation.y = bananaRotationYOffset
    scene.add(banana);
})

let books = []

let pivotPoint = new THREE.Object3D();
scene.add(pivotPoint)

function generateBook() {
    loader.load('assets/paper.glb', function (bookGLTF) {
        let book = bookGLTF.scene;
        book.position.z = -bookRotationRadius;
        book.position.y = bookYOffset
        scene.add(book);
        pivotPoint.add(book)
        books.push(book);
    })
}

for (let i = 0; i < bookCount; i++) {
    generateBook();
}

const Clock = new THREE.Clock();
let bgColor = 0;

let addedClockTime = 0;

function animate() {
    requestAnimationFrame(animate);
    let dataArray = analyser.getFrequencyData();

    let freqAvg = avg(dataArray);

    let lowerHalfArray = dataArray.slice(0, (dataArray.length / 2) - 1);
    let upperHalfArray = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);
    let lowerFreqAvg = avg(upperHalfArray);
    let lowerFreqMin = min(upperHalfArray);
    let higherFreqMin = min(lowerHalfArray);

    addedClockTime += higherFreqMin;

    if (banana) {
        banana.rotation.y = gradualChange((Math.sin(Clock.getElapsedTime()) * .1) * (sound.isPlaying ? 1 : .2) + bananaRotationYOffset, banana.rotation.y, .005)
        banana.position.y = gradualChange((Math.sin(Clock.getElapsedTime() * bananaSpeed) * jumpDistance) * (sound.isPlaying ? .75 : .2), banana.position.y, .01);
    }

    books.forEach((book) => {
        //book.position.x = Math.sin(Clock.getElapsedTime()) * 10
        book.rotation.y += 0.005 * (sound.isPlaying ? .75 : .2)
        let targetYPos = (Math.sin(Clock.getElapsedTime() + addedClockTime * .001) * .5) * (sound.isPlaying ? 1 : .2)
        book.rotation.z = gradualChange(targetYPos, book.rotation.z, .01)
        book.position.y = gradualChange(Math.sin(Clock.getElapsedTime()) * (sound.isPlaying ? 1 : .2) + bookYOffset, book.position.y, .05)
    })

    pivotPoint.rotation.y += .001 * (sound.isPlaying ? 1 : .2);


    bgColor = gradualChange((freqAvg / 255) * 2, bgColor, .001)

    renderer.setClearColor(backgroundColor, bgColor + .5);


    renderer.render(scene, camera);
}

animate();

function gradualChange(goal, prevValue, sens) {
    let newValue;
    if (prevValue < goal) {
        newValue = prevValue + sens;
    } else if (prevValue > goal) {
        newValue = prevValue - sens;
    } else {
        newValue = prevValue;
    }
    if (newValue < goal && goal < prevValue) {
        newValue = goal;
    }
    if (newValue > goal && goal > prevValue) {
        newValue = goal;
    }
    return newValue
}

function avg(arr) {
    if (arr.length > 0) {
        let total = arr.reduce(function (sum, b) { return sum + b; });
        return (total / arr.length);
    }
}

function min(arr) {
    return arr.reduce(function (a, b) { return Math.min(a, b); })
}