import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';

export interface Attachment {
  id: number;
  projectId: number;
  url: string;
  fileName: string;
  fileType: string;
  title?: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AttachmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/attachments`;

  upload(projectId: number, file: File, title?: string): Observable<Attachment> {
    const formData = new FormData();
    formData.append('projectId', projectId.toString());
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }
    return this.http.post<Attachment>(this.apiUrl, formData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
