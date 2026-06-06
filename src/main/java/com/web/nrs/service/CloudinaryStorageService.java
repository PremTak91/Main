package com.web.nrs.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryStorageService {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        if (!cloudName.equals("your_cloud_name")) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true));
        }
    }

    public String compressAndUploadImage(String folderName, MultipartFile file) throws IOException {
        if (cloudinary == null) {
            throw new RuntimeException("Cloudinary is not configured correctly.");
        }

        String uniqueFilename = UUID.randomUUID().toString();
        String sanitizedFolder = sanitizeFolderName(folderName);

        // Let Cloudinary handle the resizing and compression to avoid OutOfMemoryError on our server heap
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", sanitizedFolder,
                "public_id", uniqueFilename,
                "transformation", new com.cloudinary.Transformation().width(1080).height(1080).crop("limit").quality(70).fetchFormat("jpg")
        ));

        // Returns the public_id which is needed for deletion
        return uploadResult.get("public_id").toString();
    }

    public Map<String, String> uploadDocument(String folderName, MultipartFile file) throws IOException {
        if (cloudinary == null) {
            throw new RuntimeException("Cloudinary is not configured correctly.");
        }

        String uniqueFilename = UUID.randomUUID().toString();
        String sanitizedFolder = sanitizeFolderName(folderName);

        // Use 'raw' resource_type for documents (PDF, DOCX, etc.)
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", sanitizedFolder,
                "public_id", uniqueFilename,
                "resource_type", "raw"
        ));

        return Map.of(
            "public_id", uploadResult.get("public_id").toString(),
            "url", uploadResult.get("secure_url").toString()
        );
    }

    public void deleteImage(String publicId) {
        if (cloudinary != null && publicId != null && !publicId.isEmpty()) {
            try {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete image from Cloudinary", e);
            }
        }
    }

    public void deleteDocument(String publicId) {
        if (cloudinary != null && publicId != null && !publicId.isEmpty()) {
            try {
                cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
            } catch (IOException e) {
                throw new RuntimeException("Failed to delete document from Cloudinary", e);
            }
        }
    }

    public String generateUrl(String publicId) {
        if (cloudinary == null) return "";
        return cloudinary.url().secure(true).generate(publicId);
    }

    private String sanitizeFolderName(String folderName) {
        if (folderName == null) return null;
        return java.util.Arrays.stream(folderName.split("/"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.joining("/"));
    }
}

