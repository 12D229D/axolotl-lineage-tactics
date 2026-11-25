/**
 * Scene Manager for Axolotl Lineage Tactics
 * Coordinates transition states: POND (Charca), BREEDING (Crianza), EXPEDITION (Mapa/Nodos), COMBAT (Combate Hexagonal), LINEAGE (Árbol/Museo)
 */

export class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.listeners = [];
    }

    registerScene(name, containerElement, onEnterCallback, onExitCallback) {
        this.scenes.set(name, {
            element: containerElement,
            onEnter: onEnterCallback,
            onExit: onExitCallback
        });
    }

    switchScene(name, data = {}) {
        if (this.currentScene && this.scenes.has(this.currentScene)) {
            const current = this.scenes.get(this.currentScene);
            if (current.onExit) current.onExit();
            if (current.element) {
                current.element.classList.remove('active');
                current.element.style.display = 'none';
            }
        }

        if (this.scenes.has(name)) {
            const next = this.scenes.get(name);
            this.currentScene = name;
            if (next.element) {
                next.element.classList.add('active');
                next.element.style.display = 'block';
            }
            if (next.onEnter) next.onEnter(data);

            // Notificar a observadores (como navbars)
            this.listeners.forEach(cb => cb(name, data));
        } else {
            console.error(`Scene ${name} not found`);
        }
    }

    onSceneChange(callback) {
        this.listeners.push(callback);
    }
}
