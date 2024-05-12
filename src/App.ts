import { PlaneGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, TextureLoader, WebGLRenderer, Raycaster, Vector2, Vector3, CanvasTexture, SpriteMaterial, Sprite, Shape, ShapeGeometry  } from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry";

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
    private annotation: HTMLElement | null;
    private currentPopupPosition: Vector3;
    private positions: Vector3[];

    constructor()
    {
        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.fov = 45;
        this.camera.position.z = 454;
        this.scene = new Scene();
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0x000000, 0); // the default
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.imagePlane = new Mesh();
        this.isDragging = false;
        this.lastX = 0;
        this.limit = 200;
        this.sensitivity = 1;

        this.positions = [];
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

        this.annotation = document.querySelector('.annotation');
        this.currentPopupPosition = new Vector3();

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", this.onWindowResize.bind(this), false);

        this.addEventListeners();
        this.drawBackground();
        this.drawForeground();
        this.drawLayers();
        // this.drawAnnotation();

        this.animate();
    }

    private addEventListeners(): void
    {
        let a_raycaster = new Raycaster();
        let a_mouse = new Vector2();
        let a_intersects;
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            this.isDragging = true;
            this.lastX = event.clientX;

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            a_raycaster.setFromCamera(a_mouse, this.camera);
            a_intersects = raycaster.intersectObjects(this.colliders);
            if (a_intersects.length > 0) {
                let point = a_intersects[0].point;
                const boxGeometry = new PlaneGeometry(100, 100);
                const boxMaterial = new MeshBasicMaterial({ color: 0xff1510, transparent: true, opacity: 0.5 });
                const box = new Mesh(boxGeometry, boxMaterial);
                box.position.z = 1;
                box.position.setX(point.x);
                box.position.setY(point.y);
                box.scale.setX(0.05);
                box.scale.setY(0.05);
                box.visible = true;
                this.scene.add(box);
                console.log(point);

                this.positions.push(point);
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            this.isDragging = false;
            let stringified = JSON.stringify(this.positions);
            console.log(stringified);

            if(this.positions.length > 10) {
                var shape = new Shape();
                for(let i = 0; i < this.positions.length; i++) {
                    if (i == 0) {
                        shape.moveTo(this.positions[i].x, this.positions[i].y);
                    } else {
                        shape.lineTo(this.positions[i].x, this.positions[i].y);
                    }
                }
                let geometry = new ShapeGeometry( shape );
                let mesh = new Mesh( geometry, new MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 }));
                this.scene.add(mesh);
            }
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (!this.isDragging) return;
        
            const deltaX = event.clientX - this.lastX;
        
            const newX = this.camera.position.x - deltaX * this.sensitivity;
            this.camera.position.x = Math.max(-this.limit, Math.min(this.limit, newX));
            // this.camera.position.x = newX;
        
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
                this.hidePopup();
            }
        });

        this.renderer.domElement.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            intersects = raycaster.intersectObjects(this.colliders);
            if (intersects.length > 0) {
                let layerId = intersects[0].object.userData.id;
                this.currentPopupPosition = this.colliders[layerId].position;
                // this.showPopup(this.layers[layerId]);
            }
        })
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

    private showPopup(layer: Mesh): void
    {
        const vector = layer.position.clone();
        const canvas = this.renderer.domElement;
        
        vector.project(this.camera);
        
        vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
        vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));
        
        if (this.annotation instanceof HTMLElement) {
            this.annotation.style.top = `${vector.y}px`;
            this.annotation.style.left = `${vector.x}px`;
            this.annotation.style.display = 'block';
        }
    }

    private hidePopup() : void
    {
        if (this.annotation instanceof HTMLElement) {
            this.annotation.style.display = 'none';
        }
    }

    private drawAnnotation(): void
    {
        const canvas = document.getElementById('popup');
        if (!(canvas instanceof HTMLCanvasElement)) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const x = 32;
        const y = 32;
        const radius = 30;
        const startAngle = 0;
        const endAngle = Math.PI * 2;

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.fill();

        ctx.strokeStyle = 'rgb(255, 255, 255)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.stroke();

        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', x, y);
    }

    private updateScreenPosition() : void 
    {
        const vector = new Vector3(this.currentPopupPosition.x, this.currentPopupPosition.y, this.currentPopupPosition.z);
        const canvas = this.renderer.domElement;
    
        vector.project(this.camera);
    
        vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
        vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));

        if (!(this.annotation instanceof HTMLElement)) return;
        this.annotation.style.top = `${vector.y}px`;
        this.annotation.style.left = `${vector.x}px`;
    }

    private animate(): void
    {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
        this.updateScreenPosition();
    }
}

new App();