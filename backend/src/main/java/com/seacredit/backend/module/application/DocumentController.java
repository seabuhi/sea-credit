package com.seacredit.backend.module.application;

import com.seacredit.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'CREDIT_OFFICER', 'CLIENT')")
    public ResponseEntity<ApiResponse<ApplicationDocument>> uploadDocument(
            @RequestParam("applicationId") Long applicationId,
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "notes", required = false) String notes) {
        
        return ResponseEntity.ok(ApiResponse.ok(
            documentService.uploadDocument(applicationId, documentType, file, notes),
            "Sənəd uğurla yükləndi"
        ));
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("authenticated")
    public ResponseEntity<ApiResponse<List<ApplicationDocument>>> getDocuments(@PathVariable Long applicationId) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getDocumentsByApplication(applicationId)));
    }

    @GetMapping("/download/{id}")
    @PreAuthorize("authenticated")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        Resource resource = documentService.loadDocumentAsResource(id);
        
        // Try to determine content type or default to octet-stream
        String contentType = "application/octet-stream";
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
