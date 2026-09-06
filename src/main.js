import './style.css';
import { createDessert } from './dessert/createDessert.js';
import { setupScene } from './scene/setupScene.js';

setupScene(document.querySelector('#scene'), createDessert());
