import { PlaneGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, TextureLoader, WebGLRenderer, Raycaster, Vector2 } from "three";

export class App
{
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private imagePlane: Mesh;
    private isDragging: boolean;
    private lastX: number;
    private limit: number;
    private sensitivity: number;
    private layers: Mesh[];
    private colliders: Mesh[];
    private materials: MeshBasicMaterial[];
    private hoverMaterials: MeshBasicMaterial[];
    private layerPositions: Vector2[];
    private layerScales: Vector2[];

    constructor()
    {
        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = 454;
        // this.camera.position.z = 1000;
        this.scene = new Scene();
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0x000000, 0); // the default
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.imagePlane = new Mesh();
        this.isDragging = false;
        this.lastX = 0;
        this.limit = 179;
        this.sensitivity = 1;

        this.layers = [];
        this.colliders = [];
        this.materials = [];
        this.hoverMaterials = [];
        this.layerPositions = [
            new Vector2(-750, 150),
            new Vector2(-550, 180),
            new Vector2(-700, -200),
            new Vector2(-500, 0),
            new Vector2(-350, -230),
            new Vector2(-90, -225),
            new Vector2(-250, -70),
            new Vector2(-320, 150),
            new Vector2(-20, 200),
            new Vector2(90, -120)
        ];

        this.layerScales = [
            new Vector2(1.5, 3),
            new Vector2(2, 1.8),
            new Vector2(4, 2.8),
            new Vector2(2, 1.2),
            new Vector2(3, 1.9),
            new Vector2(2, 1.9),
            new Vector2(4, 2),
            new Vector2(2, 3),
            new Vector2(3.5, 1.9),
            new Vector2(2, 2)
        ];

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", this.onWindowResize.bind(this), false);

        this.addEventListeners();
        this.drawBackground();
        this.drawForeground();
        this.drawLayers();

        this.animate();
    }

    private addEventListeners(): void
    {
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            this.isDragging = true;
            this.lastX = event.clientX;
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (!this.isDragging) return;
        
            const deltaX = event.clientX - this.lastX;
        
            const newX = this.camera.position.x - deltaX * this.sensitivity;
            this.camera.position.x = Math.max(-this.limit, Math.min(this.limit, newX));
        
            this.lastX = event.clientX;
        
            this.renderer.render(this.scene, this.camera);
        });

        let raycaster = new Raycaster();
        let mouse = new Vector2();
        let intersects;
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            intersects = raycaster.intersectObjects(this.colliders);
            if (intersects.length > 0) {
                let layerId = intersects[0].object.userData.id;
                this.resetMaterials();
                this.changeMaterial(this.layers[layerId], this.hoverMaterials[layerId]);
            } else {
                this.resetMaterials();
            }
        });
    }

    private drawBackground(): void
    {
        const texture = new TextureLoader().load("images/textures/bg.png");
        const geometry = new PlaneGeometry(1698, 637);
        const material = new MeshBasicMaterial({ map: texture });
        this.imagePlane = new Mesh(geometry, material);
        this.scene.add(this.imagePlane);
    }

    private drawForeground(): void
    {
        const texture = new TextureLoader().load("images/textures/full_frame.png");
        const geometry = new PlaneGeometry(1698, 637);
        const material = new MeshBasicMaterial({ map: texture, transparent: true });
        const foregroundPlane = new Mesh(geometry, material);
        foregroundPlane.position.z = 0.1;
        this.scene.add(foregroundPlane);
    }

    private drawLayers(): void
    {
        for (let i = 1; i <= 10; i++)
        {
            const texture = new TextureLoader().load(`images/textures/frames/Frame-${i}.png`);
            const geometry = new PlaneGeometry(1698, 637);
            const material = new MeshBasicMaterial({ map: texture, transparent: true });
            const textureHover = new TextureLoader().load(`images/textures/frames/Frame-${i}-hover.png`);
            const materialHover = new MeshBasicMaterial({ map: textureHover, transparent: true });
            const layer = new Mesh(geometry, material);
            layer.visible = false;
            layer.position.z = 0.2 * i;
            layer.userData = { id: i - 1 };
            this.scene.add(layer);

            // add red boxes to the layers
            const boxGeometry = new PlaneGeometry(100, 100);
            const boxMaterial = new MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
            const box = new Mesh(boxGeometry, boxMaterial);
            box.position.z = 0.2 * i;
            box.position.setX(this.layerPositions[i - 1].x);
            box.position.setY(this.layerPositions[i - 1].y);
            box.scale.setX(this.layerScales[i - 1].x);
            box.scale.setY(this.layerScales[i - 1].y);
            box.userData = { id: i - 1 };
            box.visible = false;
            this.scene.add(box);

            this.layers.push(layer);
            this.colliders.push(box);
            this.materials.push(material);
            this.hoverMaterials.push(materialHover);
        }
    }

    private changeMaterial(layer: Mesh, material: MeshBasicMaterial): void
    {
        layer.visible = true;
        layer.material = material;
    }

    private resetMaterials(): void
    {
        for (let i = 0; i < this.layers.length; i++)
        {
            this.layers[i].material = this.materials[i];
            this.layers[i].visible = false;
        }
    }

    private onWindowResize(): void
    {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(): void
    {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}

new App();