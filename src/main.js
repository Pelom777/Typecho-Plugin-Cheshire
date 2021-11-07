function main(skel){
	var isMobile;
	var lastFrameTime = Date.now() / 1000;
	var canvas;
	var $canvas;
	var shader;
	var batcher;
	var gl;
	var mvp = new spine.webgl.Matrix4();
	var assetManager;
	var skeletonRenderer;
	var debugRenderer;
	var shapes;
	var activeSkeleton;
	var animationState;
	var root;
	var isHover = false;
	var isMove = false;

	function checkMobile() {
		if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			return true;
		} else {
			return false;
		}
	}
	function init(){
		isMobile = checkMobile();
		// Setup canvas and WebGL context. We pass alpha: false to canvas.getContext() so we don't use premultiplied alpha when
		// loading textures. That is handled separately by PolygonBatcher.
		canvas = document.getElementById("canvas");
		$canvas = $("#canvas");
		//set size
		canvas.width = 300;
		canvas.height = 300;
		var config = { alpha: true };
		gl = canvas.getContext("webgl", config) || canvas.getContext("experimental-webgl", config);
		if (!gl) {
			alert('WebGL is unavailable.');
			return;
		}
		// Create a simple shader, mesh, model-view-projection matrix and SkeletonRenderer.
		shader = spine.webgl.Shader.newTwoColoredTextured(gl);
		batcher = new spine.webgl.PolygonBatcher(gl);
		mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);
		skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
		debugRenderer = new spine.webgl.SkeletonDebugRenderer(gl);
		debugRenderer.drawRegionAttachments = true;
		debugRenderer.drawBoundingBoxes = true;
		debugRenderer.drawMeshHull = true;
		debugRenderer.drawMeshTriangles = true;
		debugRenderer.drawPaths = true;
		debugShader = spine.webgl.Shader.newColored(gl);
		shapes = new spine.webgl.ShapeRenderer(gl);
		assetManager = new spine.webgl.AssetManager(gl);
		loadAsset(skel);
		requestAnimationFrame(load);
		
		//css
		$canvas.css({
			"overflow" : "hidden",
			"position" : "fixed",
			"left" : "0",
			"bottom" : "0",
			"z-index" : "1"
		});
		//event
		$(document).on({
			'visibilitychange' : function(e){
				if(e.target.visibilityState === "hidden"){
					animationState.setAnimation(0, "sleep", true, 0);
				}
			},
			'click' : function(e){
				if(isMove || e.target === canvas){
					return;
				}
				animationState.setAnimation(0, "touch", false, 0);
				back();
				idle();
			},
		})
		$canvas.on({
			//free drag
    	    'mousedown' : function(e){
				if(isMove){
					return;
				}
				isHover = false;
    	        var el=$(this);
    	        var os = el.offset();
				dx = e.pageX - os.left, dy = e.pageY - os.top;
				console.log(os.top, Math.floor(dy));
				animationState.setAnimation(0, "tuozhuai", true, 0);
    	        $(document).on('mousemove.drag', function(e){
    	            el.offset({
    	        	    left: Math.min(Math.max(e.pageX - dx, 0), window.innerWidth - $canvas.width()),
    	        	    top: Math.min(Math.max(e.pageY - dy, window.scrollY), window.innerHeight - $canvas.height() + window.scrollY)
    	        	});
    	        }).on('mouseup',function(e){
					$(document).off('mousemove.drag');
					if(isMove || e.target !== canvas){
						return;
					}
					animationState.setEmptyAnimation(0, 0);
					idle();
				})
    	    },
			'mouseenter' : function(e){
				if(isMove){
					return;
				}
				isHover = true;
				animationState.setAnimation(0, "dance", true, 0);
			},
			'mouseout' : function(e){
				if(isMove){
					return;
				}
				if(isHover){
					isHover = false;
					animationState.setAnimation(0, "motou", false, 0);
					idle();
				}
			},
			'mouseup' : function(e){
				if(isMove){
					return;
				}
				back();
			},
    	})
	}
	function loadAsset(skel){
		assetManager.loadBinary(skel);
		assetManager.loadTextureAtlas(skel.replace(/skel/, "atlas"));
	}
	function load() {
		// Wait until the AssetManager has loaded all resources, then load the skeletons.
		if (assetManager.isLoadingComplete()) {
			activeSkeleton = loadSkeleton(skel, false);
			requestAnimationFrame(render);
		} else {
			requestAnimationFrame(load);
		}
	}
	function loadSkeleton (name, premultipliedAlpha, skin) {
		if (skin === undefined) skin = "default";
		// Load the texture atlas using name.atlas from the AssetManager.
		var atlas = assetManager.get(skel.replace(/skel/, "atlas"));
		// Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
		var atlasLoader = new spine.AtlasAttachmentLoader(atlas);
		// Create a SkeletonBinary instance for parsing the .skel file.
		// var skeletonBinary = new spine.SkeletonBinary(atlasLoader);
		var skeletonBinary = new spine.SkeletonBinary(atlasLoader);
		// Set the scale to apply during parsing, parse the file, and create a new skeleton.
		skeletonBinary.scale = isMobile ? 0.75 : 1;
		var skeletonData;
		skeletonData = skeletonBinary.readSkeletonData(assetManager.get(skel));
		var skeleton = new spine.Skeleton(skeletonData);
		root = skeletonData.findBone("root");
		skeleton.setSkinByName(skin);
		var bounds = calculateBounds(skeleton);
		// Create an AnimationState, and set the initial animation in looping mode.
		animationStateData = new spine.AnimationStateData(skeleton.data);
		animationState = new spine.AnimationState(animationStateData);
		idle();
		// Pack everything up and return to caller.
		return { skeleton: skeleton, state: animationState, bounds: bounds, premultipliedAlpha: premultipliedAlpha };
	}
	function back(){
		var left = $canvas.position().left;
		var right = window.innerWidth - left - $canvas.width();
		if(left === 0){
			$canvas.css("transform", "scale(1, 1)");
			return;
		}
		if(right === 0){
			$canvas.css("transform", "scale(-1, 1)");
			return;
		}
		animationState.setAnimation(0, "walk", true, 0);
		isMove = true;
		if(left < right){
			//left
			$canvas.css("transform", "scale(-1, 1)");
			$canvas.animate({left : 0}, left * 3, function(){
				isMove = false;
				animationState.setEmptyAnimation(0, 0);
				$canvas.css("transform", "scale(1, 1)");
				idle();
			});
		}
		else{
			//right
			$canvas.css("transform", "scale(1, 1)");
			$canvas.animate({left : window.innerWidth - $canvas.width()}, right * 3, function(){
				isMove = false;
				animationState.setEmptyAnimation(0, 0);
				$canvas.css("transform", "scale(-1, 1)");
				idle();
			});
		}
	}
	function idle(){
		animationState.addAnimation(0, "normal", true, 0);
		animationState.addAnimation(0, "sit", true, 30);
	}
	function calculateBounds(skeleton) {
		skeleton.setToSetupPose();
		skeleton.updateWorldTransform();
		var offset = new spine.Vector2();
		var size = new spine.Vector2();
		skeleton.getBounds(offset, size, []);
		return { offset: offset, size: size };
	}
	function render () {
		var now = Date.now() / 1000;
		var delta = now - lastFrameTime;
		lastFrameTime = now;
		// Update the MVP matrix to adjust for canvas size changes
		resize();
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		// Apply the animation state based on the delta time.
		var state = activeSkeleton.state;
		var skeleton = activeSkeleton.skeleton;
		var bounds = activeSkeleton.bounds;
		var premultipliedAlpha = activeSkeleton.premultipliedAlpha;
		state.update(delta);
		state.apply(skeleton);
		skeleton.updateWorldTransform();
		// Bind the shader and set the texture and model-view-projection matrix.
		shader.bind();
		shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
		shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);
		// Start the batch and tell the SkeletonRenderer to render the active skeleton.
		batcher.begin(shader);
		skeletonRenderer.premultipliedAlpha = premultipliedAlpha;
		skeletonRenderer.draw(batcher, skeleton);
		batcher.end();
		shader.unbind();
		requestAnimationFrame(render);
	}
	function resize () {
		var w = canvas.clientWidth;
		var h = canvas.clientHeight;
		var bounds = activeSkeleton.bounds;
		if (canvas.width != w || canvas.height != h) {
			canvas.width = w;
			canvas.height = h;
		}
		// magic
		var centerX = bounds.offset.x + bounds.size.x / 2;
		var centerY = bounds.offset.y + bounds.size.y / 2;
		var scaleX = bounds.size.x / canvas.width;
		var scaleY = bounds.size.y / canvas.height;
		var scale = Math.max(scaleX, scaleY) * 1.5;
		if (scale < 1) scale = 1;
		var width = canvas.width * scale;
		var height = canvas.height * scale;
		mvp.ortho2d(centerX - width / 2, centerY - height / 5 * 3, width, height);
		gl.viewport(0, 0, canvas.width, canvas.height);
	}

	init();
}