package com.srpetworld.service;

import com.srpetworld.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.regex.Pattern;

public final class InputSanitizer {

    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\p{Cntrl}&&[^\r\n\t]]");
    private static final Pattern HTML_TAG = Pattern.compile("<[^>]*>");

    private InputSanitizer() {}

    public static String sanitizeText(String input, int maxLength) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        String noControl = CONTROL_CHARS.matcher(trimmed).replaceAll("");
        if (HTML_TAG.matcher(noControl).find() || noControl.toLowerCase().contains("javascript:")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "HTML tags or script content are not allowed");
        }
        if (noControl.length() > maxLength) {
            return noControl.substring(0, maxLength);
        }
        return noControl;
    }

    public static String sanitizeImageUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if (trimmed.startsWith("https://") || trimmed.startsWith("/uploads/")) {
            return trimmed;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Image URL must use https:// or /uploads/");
    }
}
