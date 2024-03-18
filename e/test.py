import cv2
import numpy as np
import os

# Constants
SCALED_SIZE = (1024, 1024)  # Standard size for comparison
FEATURE_MATCH_RATIO = 0.75  # Lowe's ratio test
MIN_MATCH_COUNT = 10  # Minimum good matches to be a duplicate

def remove_whitespace(image):
    """Remove the whitespace from the image by finding the largest contour."""
    _, thresh = cv2.threshold(image, 240, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)
        cropped_image = image[y:y+h, x:x+w]
        return cropped_image
    return image

def resize_image_to_standard(image):
    """Resize image to a standard size while keeping aspect ratio."""
    ratio = min(SCALED_SIZE[0] / image.shape[0], SCALED_SIZE[1] / image.shape[1])
    new_size = (int(image.shape[1] * ratio), int(image.shape[0] * ratio))
    resized_image = cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)
    canvas = np.full((SCALED_SIZE[1], SCALED_SIZE[0]), 255, dtype=np.uint8)
    x_offset = (SCALED_SIZE[0] - resized_image.shape[1]) // 2
    y_offset = (SCALED_SIZE[1] - resized_image.shape[0]) // 2
    canvas[y_offset:y_offset+resized_image.shape[0], x_offset:x_offset+resized_image.shape[1]] = resized_image
    return canvas

def compute_sift_features(image):
    """Computes SIFT features for the image."""
    sift = cv2.SIFT_create()
    keypoints, descriptors = sift.detectAndCompute(image, None)
    return keypoints, descriptors

def compare_images(image1, image2):
    """Compares two images and decides if they are duplicates."""
    # Preprocess images
    image1_processed = remove_whitespace(image1)
    image2_processed = remove_whitespace(image2)
    image1_resized = resize_image_to_standard(image1_processed)
    image2_resized = resize_image_to_standard(image2_processed)

    # Compute SIFT features
    kp1, des1 = compute_sift_features(image1_resized)
    kp2, des2 = compute_sift_features(image2_resized)

    # Match descriptors
    if des1 is not None and des2 is not None and len(des1) > 0 and len(des2) > 0:
        flann = cv2.FlannBasedMatcher({'algorithm': 1, 'trees': 5}, {'checks': 50})
        matches = flann.knnMatch(des1, des2, k=2)

        # Apply Lowe's ratio test
        good_matches = []
        for m, n in matches:
            if m.distance < FEATURE_MATCH_RATIO * n.distance:
                good_matches.append(m)

        return len(good_matches) > MIN_MATCH_COUNT
    return False

def load_and_gray_image(image_path):
    return cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

def find_images_in_range(start, end, folder_path):
    image_paths = {}
    for image_name in os.listdir(folder_path):
        if image_name.endswith('.png'):
            try:
                index = int(image_name.split('.')[0])
                if start <= index <= end:
                    image_paths[index] = os.path.join(folder_path, image_name)
            except ValueError:
                # Skip files that do not conform to the expected naming convention
                continue
    return image_paths

def compare_images_within_range(folder_path, start, end):
    image_paths = find_images_in_range(start, end, folder_path)
    compared = set()
    similar_images = []

    for i, path_i in image_paths.items():
        if i in compared:
            continue
        
        image1 = load_and_gray_image(path_i)
        for j, path_j in image_paths.items():
            if i != j and j not in compared:
                image2 = load_and_gray_image(path_j)
                if compare_images(image1, image2):
                    similar_images.append(path_j)
                    compared.add(j)
        
        compared.add(i)

    print("Similar Images:", similar_images)

compare_images_within_range('e/gen-img', 1, 13)