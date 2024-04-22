import { PlaneGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, TextureLoader, WebGLRenderer } from "three";

export class App
{
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private imagePlane: Mesh;
    private isDragging: boolean;
    private lastX: number;
    private lastY: number;
    private sensitivity: number;

    constructor()
    {
        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = 500;
        this.scene = new Scene();
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0x000000, 0); // the default
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.imagePlane = new Mesh();
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.sensitivity = 1;

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", this.onWindowResize.bind(this), false);

        this.addEventListeners();
        this.drawBackground();
        this.drawForeground();

        this.animate();
    }

    private addEventListeners(): void
    {
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            this.isDragging = true;
            this.lastX = event.clientX;
            this.lastY = event.clientY;
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (!this.isDragging) return;
        
            const deltaX = event.clientX - this.lastX;
        
            this.camera.position.x -= deltaX * this.sensitivity;
        
            this.lastX = event.clientX;
            this.lastY = event.clientY;
        
            this.renderer.render(this.scene, this.camera);
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

    // private drawL

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