import * as Three from '../three.js/three.module.js';
import { OrbitControls } from '../three.js/OrbitControls.js';
import { FBXLoader } from '../three.js/FBXLoader.js';

class App {
    constructor() {
        // id가 webgl-container인 div요소를 얻어와서, 상수에 저장 
        const divContainer = document.querySelector("#webgl-container");
        // 얻어온 상수를 클래스 필드에 정의
        // 다른 메서드에서 참조할 수 있도록 필드에 정의한다.
        this._divContainer = divContainer;

        // 렌더러 생성, Three.js의 WebGLRenderer 클래스로 생성
        // antialias를 활성화 시키면 렌더링될 때 오브젝트들의 경계선이 계단 현상 없이 부드럽게 표현된다.
        const renderer = new Three.WebGLRenderer({ antialias: true });
        // window의 devicePixelRatio 속성을 얻어와 PixelRatio 설정
        // 디스플레이 설정의 배율값을 얻어온다.
        renderer.setPixelRatio(window.devicePixelRatio);
        // domElement를 자식으로 추가.
        // canvas 타입의 DOM 객체이다.
        // 문서 객체 모델(DOM, Document Object Model)은 XML이나 HTML 문서에 접근하기 위한 일종의 인터페이스.
        divContainer.appendChild(renderer.domElement);
        // 다른 메서드에서 참조할 수 있도록 필드에 정의한다.
        this._renderer = renderer;

        // Scene 객체 생성
        const scene = new Three.Scene();
        // 다른 메서드에서 참조할 수 있도록 필드에 정의한다.
        this._scene = scene;

        // 카메라 객체를 구성
        this._setupCamera();
        // 조명 설정
        this._setupLight();
        // 3D 모델 설정
        this._setupModel();
        // 마우스 컨트롤 설정
        this._setupControls();


        // 창 크기가 변경될 때 발생하는 이벤트인 onresize에 App 클래스의 resize 메서드를 연결한다.
        // this가 가리키는 객체가 이벤트 객체가 아닌 App클래스 객체가 되도록 하기 위해 bind로 설정한다.
        // onresize 이벤트가 필요한 이유는 렌더러와 카메라는 창 크기가 변경될 때마다 그 크기에 맞게 속성값을 재설정해줘야 한다.
        window.onresize = this.resize.bind(this);
        // onresize 이벤트와 상관없이 생성자에서 resize 메서드를 호출한다.
        // 렌더러와 카메라의 속성을 창크기에 맞게 설정해준다. 
        this.resize();

        // render 메서드를 requestAnimationFrame이라는 API에 넘겨줘서 호출해준다.
        // render 메서드 안에서 쓰이는 this가 App 클래스 객체를 가리키도록 하기 위해 bind 사용
        requestAnimationFrame(this.render.bind(this));
    }

    _setupCamera() {
        // 3D 그래픽을 출력할 영역 width, height 얻어오기
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;
        // 얻어온 크기를 바탕으로 Perspective 카메라 객체 생성
        const camera = new Three.PerspectiveCamera(
            75,
            width / height,
            0.1,
            100
        );
        camera.position.z = 2;
        // 다른 메서드에서 참조할 수 있도록 필드에 정의한다.
        this._camera = camera;
    }

    _setupLight() {
        // 광원 색상 설정
        const color = 0xffffff;
        // 광원 세기 설정
        const intensity = 1;
        // 위 설정을 바탕으로 Directional 광원 객체 생성
        const light = new Three.DirectionalLight(color, intensity);
        // 광원 위치 설정
        light.position.set(-1, 2, 4);
        // Scene객체에 광원 추가
        this._scene.add(light);

        // AmbientLight 추가
        const ambientLight = new Three.AmbientLight(0xffffff, 1);
        this._scene.add(ambientLight);
    }

    // 카메라를 적당한 거리에 위치시키는 메서드
    _zoomFit(object3D, camera, viewMode, bFront) {
        // 모델의 경계 박스
        const box = new Three.Box3().setFromObject(object3D);
        // 모델의 경계 박스 대각 길이
        const sizeBox = box.getSize(new Three.Vector3()).length();
        // 모델의 경계 박스 중심 위치
        const centerBox = box.getCenter(new Three.Vector3());

        // 파라미터로 카메라 방향 시점을 X, Y, Z 축으로 선택
        let offsetX = 0, offsetY = 0, offsetZ = 0;
        viewMode === "X" ? offsetX = 1 : (viewMode === "Y") ? 
            offsetY = 1 : offsetZ = 1;

        // 파라미터로 각 축방향의 양의 방향인지 음의 방향인지 선택
        if(!bFront) {
            offsetX *= -1;
            offsetY *= -1;
            offsetZ *= -1;
        }
        camera.position.set(
            centerBox.x + offsetX, centerBox.y + offsetY, centerBox.z + offsetZ);

        const margin = 10;
        // 모델 크기의 절반값
        // 모델이 너무 딱 맞아 보여서 margin값을 더해줬다.
        const halfSizeModel = (sizeBox + margin) * 0.5;
        // 카메라의 fov의 절반값
        const halfFov = Three.MathUtils.degToRad(camera.fov * .5);
        // 모델을 화면에 꽉 채우기 위한 적당한 거리
        const distance = halfSizeModel / Math.tan(halfFov);
        // 모델을 중심에서 카메라 위치로 향하는 방향 단위 벡터 계산
        // 두 위치 벡터를 빼줘서 방향을 구한다.
        const direction = (new Three.Vector3()).subVectors(
            camera.position, centerBox).normalize();
        // "단위 방향 벡터" 방향으로, 모델 중심 위치로부터 distance 거리만큼 떨어진 위치
        const position = direction.multiplyScalar(distance).add(centerBox);

        camera.position.copy(position);
        // 모델의 크기에 맞춰 카메라의 near, far 값을 대략적으로 조정
        camera.near = sizeBox / 100;
        camera.far = sizeBox * 100;

        // 카메라 기본 속성 변경에 따른 투영행렬 업데이트
        camera.updateProjectionMatrix();

        // 카메라가 모델의 중심을 바라보도록 조정
        camera.lookAt(centerBox.x, centerBox.y, centerBox.z);

        // Control의 target도 모델 중심으로 하여 모델 하단을 축으로 움직이는 것 방지
        this._controls.target.set(centerBox.x, centerBox.y, centerBox.z);
    }

    _setupModel() {
        const loader = new FBXLoader();
        loader.load('../data/d_dom_3et.fbx', object => {
            this._scene.add(object);

            this._zoomFit(object, this._camera, "X", true);
        });
    }

    _setupControls() {
        this._controls = new OrbitControls(this._camera, this._divContainer);
    }

    resize() {
        // 3D 그래픽을 출력할 영역 width, height 얻어오기
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        // 출력할 영역 width, height로 aspect 계산하여 카메라 aspect를 설정
        this._camera.aspect = width / height;
        // 변경된 aspect를 바탕으로 ProjectionMatrix 업데이트
        this._camera.updateProjectionMatrix();

        // 출력 영역 크기를 바탕으로 렌더러 크기 설정
        this._renderer.setSize(width, height);
    }

    render(time) {
        // Scene을 카메라 시점으로 렌더링하라는 코드
        this._renderer.render(this._scene, this._camera);
        // update 메서드 안에서는 time 인자를 바탕으로 애니메이션 효과 발생
        this.update(time);
        // requestAnimationFrame을 통하여 render 메서드가 반복적으로 호출될 수 있다.
        requestAnimationFrame(this.render.bind(this));
    }

    update(time) {
        // 밀리초에서 초로 변환
        time *= 0.001;
    }
}

window.onload = function () {
    new App();
}