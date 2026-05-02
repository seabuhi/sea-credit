package com.seacredit.backend.module.application;

import com.seacredit.backend.common.exception.BusinessException;
import com.seacredit.backend.common.exception.ResourceNotFoundException;
import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DocumentService {

    private final ApplicationDocumentRepository documentRepository;
    private final LoanApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    @Value("${app.file.upload-dir:./uploads}")
    private String uploadDir;

    @Transactional
    public ApplicationDocument uploadDocument(Long applicationId, String documentType, MultipartFile file, String notes) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Müraciət", applicationId));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Cari istifadəçi tapılmadı"));

        try {
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String extension = "";
            int i = originalFileName.lastIndexOf('.');
            if (i > 0) {
                extension = originalFileName.substring(i);
            }
            
            String fileName = UUID.randomUUID().toString() + extension;
            Path targetLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            
            if (!Files.exists(targetLocation)) {
                Files.createDirectories(targetLocation);
            }

            Path filePath = targetLocation.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            ApplicationDocument doc = ApplicationDocument.builder()
                    .application(application)
                    .documentType(documentType)
                    .fileName(originalFileName)
                    .filePath(fileName) // Store only relative filename
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .uploadedBy(currentUser)
                    .notes(notes)
                    .build();

            return documentRepository.save(doc);
        } catch (IOException ex) {
            log.error("Could not store file", ex);
            throw new BusinessException("FILE_UPLOAD_ERROR", "Sənəd yüklənərkən xəta baş verdi: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<ApplicationDocument> getDocumentsByApplication(Long applicationId) {
        return documentRepository.findAllByApplicationId(applicationId);
    }

    public Resource loadDocumentAsResource(Long documentId) {
        ApplicationDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Sənəd", documentId));

        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(doc.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new BusinessException("FILE_NOT_FOUND", "Sənəd faylı tapılmadı");
            }
        } catch (MalformedURLException ex) {
            throw new BusinessException("FILE_NOT_FOUND", "Sənəd faylı tapılmadı");
        }
    }
}
