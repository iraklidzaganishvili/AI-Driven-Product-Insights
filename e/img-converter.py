import sys
import cv2
import os

# script_name = sys.argv[0]
# folder_path = sys.argv[1]
# img_start = int(sys.argv[2])
# img_end = int(sys.argv[3])
folder_path = 'e/gen-img'
img_start = 1
img_end = 2
image_descriptors = {}
min_good_matches = 40
duplicates = set()

def compute_sift_features(image):
    """Computes SIFT features for the image."""
    sift = cv2.SIFT_create()
    keypoints, descriptors = sift.detectAndCompute(image, None)
    return descriptors

# Preprocess and compute features for the specified range of images
for i in range(img_start, img_end + 1):
    image_path = os.path.join(folder_path, f'{i}.png')
    if not os.path.exists(image_path):
        continue
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    descriptors = compute_sift_features(image)
    if descriptors is not None:
        image_descriptors[image_path] = descriptors

def compare_descriptors(descriptors1, descriptors2):
    FLANN_INDEX_KDTREE = 1
    index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
    search_params = dict(checks=50)

    flann = cv2.FlannBasedMatcher(index_params, search_params)
    matches = flann.knnMatch(descriptors1, descriptors2, k=2)

    good_matches = 0
    for i, (m, n) in enumerate(matches):
        if m.distance < 0.75 * n.distance:  # Lowe's ratio test
            good_matches += 1

    return good_matches

for path1, descriptors1 in image_descriptors.items():
    for path2, descriptors2 in image_descriptors.items():
        if path1 >= path2 or path1 in duplicates or path2 in duplicates:
            continue
        if compare_descriptors(descriptors1, descriptors2) >= min_good_matches:
            duplicates.add(path2)
# Remove identified duplicates
print(len(duplicates), 'duplicates found')
for duplicate_path in duplicates:
    # os.remove(duplicate_path)
    print(f'Removed {duplicate_path}')