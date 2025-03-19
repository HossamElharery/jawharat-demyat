import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProductImage {
  id: string;
  name: string;
  path: string;
  productId: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  type: 'machine' | 'product';
  value: number;
  status: 'instock' | 'outofstock';
  stock: number;
  description: string;
  productImages?: ProductImage[];
}

export interface InventoryCreateDto {
  name: string;
  type: 'machine' | 'product';
  value: number;
  status: 'instock' | 'outofstock';
  stock: number;
  description: string;
}

export interface InventoryUpdateDto {
  name?: string;
  type?: 'machine' | 'product';
  value?: number;
  status?: 'instock' | 'outofstock';
  stock?: number;
  description?: string;
}

export interface ApiResponse<T> {
  message: string;
  result: T;
}

export interface PaginatedInventoryResponse {
  message: string;
  result: {
    inventories: InventoryProduct[];
    totalInventories: number;
    totalPages: number;
    currentPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/inventory-products`;

  constructor(private http: HttpClient) {}

  // Get all inventory products with optional filtering
  getInventoryProducts(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    type?: 'machine' | 'product'
  ): Observable<PaginatedInventoryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<PaginatedInventoryResponse>(this.apiUrl, { params });
  }

  // Get a single inventory product by ID
  getInventoryProductById(id: string): Observable<ApiResponse<InventoryProduct>> {
    return this.http.get<ApiResponse<InventoryProduct>>(`${this.apiUrl}/${id}`);
  }

  // Create a new inventory product
  createInventoryProduct(product: FormData): Observable<ApiResponse<InventoryProduct>> {
    return this.http.post<ApiResponse<InventoryProduct>>(this.apiUrl, product);
  }

  // Update an inventory product
  updateInventoryProduct(id: string, updates: InventoryUpdateDto): Observable<ApiResponse<InventoryProduct>> {
    return this.http.put<ApiResponse<InventoryProduct>>(`${this.apiUrl}/${id}`, updates);
  }

  // Delete an inventory product
  deleteInventoryProduct(id: string): Observable<ApiResponse<InventoryProduct>> {
    return this.http.delete<ApiResponse<InventoryProduct>>(`${this.apiUrl}/${id}`);
  }

  // Upload images for an inventory product
  uploadImages(productId: string, images: FormData): Observable<ApiResponse<ProductImage[]>> {
    return this.http.post<ApiResponse<ProductImage[]>>(`${this.apiUrl}/${productId}/images`, images);
  }

  // Replace an existing image
  replaceImage(productId: string, imageId: string, image: FormData): Observable<ApiResponse<ProductImage>> {
    return this.http.put<ApiResponse<ProductImage>>(`${this.apiUrl}/${productId}/images/${imageId}`, image);
  }

  // Delete an image
  deleteImage(productId: string, imageId: string): Observable<ApiResponse<ProductImage>> {
    return this.http.delete<ApiResponse<ProductImage>>(`${this.apiUrl}/${productId}/images/${imageId}`);
  }

  // Get the full image URL from the path
  getImageUrl(path: string): string {
    return `${environment.apiUrl}${path}`;
  }
}
