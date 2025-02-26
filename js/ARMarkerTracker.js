// ARMarkerTracker.js
// This class handles AR marker tracking and detection

export class ARMarkerTracker {
    constructor() {
        this.markers = new Map();
        this.session = null;
        this.viewerSpace = null;
        this.imageTracker = null;
        this.markerDetectionCallback = null;
    }
    
    // Initialize the AR marker tracking
    async initialize(session, viewerSpace) {
        this.session = session;
        this.viewerSpace = viewerSpace;
        
        // Register marker images
        await this.registerMarkers();
        
        // Create image tracker
        try {
            this.imageTracker = await this.session.requestImageTracker({
                trackedImages: Array.from(this.markers.values())
            });
            
            console.log("AR image tracking initialized successfully");
        } catch (error) {
            console.error("Failed to initialize AR image tracking:", error);
        }
    }
    
    // Register marker images to track
    async registerMarkers() {
        try {
            // Marker 1
            const marker1 = await this.createMarkerFromImage('./markers/1.png', 0.1); // 10cm width
            this.markers.set("marker1", marker1);
            
            // Marker 2
            const marker2 = await this.createMarkerFromImage('./markers/2.png', 0.1);
            this.markers.set("marker2", marker2);
            
            // Marker 3
            const marker3 = await this.createMarkerFromImage('./markers/3.png', 0.1);
            this.markers.set("marker3", marker3);
            
            console.log("Registered AR markers:", this.markers.size);
        } catch (error) {
            console.error("Error registering AR markers:", error);
        }
    }
    
    // Create a tracked image from image file
    async createMarkerFromImage(url, width) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                // Create a canvas to convert image to bitmap
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Create tracked image from bitmap
                const trackedImage = {
                    image: canvas,
                    widthInMeters: width
                };
                
                resolve(trackedImage);
            };
            img.onerror = (error) => {
                reject(`Failed to load image ${url}: ${error}`);
            };
        });
    }
    
    // Set callback for marker detection events
    set onMarkerDetected(callback) {
        this.markerDetectionCallback = callback;
    }
    
    // Update tracking on each frame
    update(frame) {
        if (!this.imageTracker) return;
        
        // Get tracking results
        const imageTrackerResults = frame.getImageTrackingResults();
        
        // Process each tracked image result
        for (const result of imageTrackerResults) {
            const trackingState = result.trackingState;
            const imageIndex = result.index;
            
            // When marker is tracked/found
            if (trackingState === "tracked") {
                const markerId = this.getMarkerIdByIndex(imageIndex);
                
                // Get pose in reference space
                const pose = frame.getPose(result.imageSpace, this.viewerSpace);
                
                if (pose && markerId && this.markerDetectionCallback) {
                    // Pass marker ID and transformation matrix to callback
                    this.markerDetectionCallback(markerId, pose.transform.matrix);
                }
            }
        }
    }
    
    // Helper to get marker ID from index
    getMarkerIdByIndex(index) {
        const markers = Array.from(this.markers.keys());
        return markers[index] || null;
    }
}