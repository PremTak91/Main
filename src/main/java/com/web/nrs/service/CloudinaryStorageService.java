package com.web.nrs.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import net.coobird.thumbnailator.Thumbnails;
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

        // Compress Image using Thumbnailator (like WhatsApp/Instagram)
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        Thumbnails.of(file.getInputStream())
                .size(1080, 1080) // Max dimensions
                .outputQuality(0.7) // 70% quality compression
                .outputFormat("jpg")
                .toOutputStream(os);

        byte[] compressedImage = os.toByteArray();
        String uniqueFilename = UUID.randomUUID().toString();

        Map uploadResult = cloudinary.uploader().upload(compressedImage, ObjectUtils.asMap(
                "folder", folderName,
                "public_id", uniqueFilename
        ));

        // Returns the public_id which is needed for deletion
        return uploadResult.get("public_id").toString();
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

    public String generateUrl(String publicId) {
        if (cloudinary == null) return "";
        return cloudinary.url().secure(true).generate(publicId);
    }
}
