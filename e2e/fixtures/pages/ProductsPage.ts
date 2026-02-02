/**
 * ProductsPage - Page Object for Products Management
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates CRUD operations for products:
 * - List products
 * - Create/Edit product
 * - Delete product
 * - Product form interactions
 * 
 * @module e2e/fixtures/pages/ProductsPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class ProductsPage {
  readonly page: Page;
  
  // List view elements
  readonly createProductButton: Locator;
  readonly productsTable: Locator;
  readonly productRow: Locator;
  readonly emptyState: Locator;
  readonly searchInput: Locator;
  
  // Product actions
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly duplicateButton: Locator;
  
  // Form elements (create/edit)
  readonly productNameInput: Locator;
  readonly productDescriptionInput: Locator;
  readonly productPriceInput: Locator;
  readonly productImageInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  
  // Tabs
  readonly generalTab: Locator;
  readonly checkoutTab: Locator;
  readonly membersAreaTab: Locator;
  readonly affiliatesTab: Locator;
  
  // Feedback elements
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  
  // Confirmation dialog
  readonly confirmDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // List view
    this.createProductButton = page.locator('[data-testid="create-product-btn"], button:has-text("Criar Produto"), button:has-text("Novo Produto")').first();
    this.productsTable = page.locator('[data-testid="products-table"], table, .products-list').first();
    this.productRow = page.locator('[data-testid="product-row"], tr[data-product-id], .product-item');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state, :has-text("Nenhum produto")').first();
    this.searchInput = page.locator('[data-testid="search-products"], input[placeholder*="Buscar"]').first();
    
    // Product actions
    this.editButton = page.locator('[data-testid="edit-product-btn"], button:has-text("Editar")');
    this.deleteButton = page.locator('[data-testid="delete-product-btn"], button:has-text("Excluir")');
    this.duplicateButton = page.locator('[data-testid="duplicate-product-btn"], button:has-text("Duplicar")');
    
    // Form elements
    this.productNameInput = page.locator('[data-testid="product-name"], input[name="name"], input[placeholder*="Nome"]').first();
    this.productDescriptionInput = page.locator('[data-testid="product-description"], textarea[name="description"]').first();
    this.productPriceInput = page.locator('[data-testid="product-price"], input[name="price"]').first();
    this.productImageInput = page.locator('[data-testid="product-image"], input[type="file"]').first();
    this.saveButton = page.locator('[data-testid="save-product-btn"], button:has-text("Salvar")').first();
    this.cancelButton = page.locator('[data-testid="cancel-btn"], button:has-text("Cancelar")').first();
    
    // Tabs
    this.generalTab = page.locator('[data-testid="tab-general"], button:has-text("Geral")').first();
    this.checkoutTab = page.locator('[data-testid="tab-checkout"], button:has-text("Checkout")').first();
    this.membersAreaTab = page.locator('[data-testid="tab-members-area"], button:has-text("Área de Membros")').first();
    this.affiliatesTab = page.locator('[data-testid="tab-affiliates"], button:has-text("Afiliados")').first();
    
    // Feedback
    this.successMessage = page.locator('[role="alert"]:has-text("sucesso"), .success-message, [data-testid="success-toast"]').first();
    this.errorMessage = page.locator('[role="alert"]:has-text("erro"), .error-message, [data-testid="error-toast"]').first();
    this.loadingSpinner = page.locator('.animate-spin, [data-loading="true"]');
    
    // Confirmation dialog
    this.confirmDialog = page.locator('[role="dialog"], [data-testid="confirm-dialog"]').first();
    this.confirmDeleteButton = page.locator('[data-testid="confirm-delete"], button:has-text("Confirmar"), button:has-text("Excluir")').last();
    this.cancelDeleteButton = page.locator('[data-testid="cancel-delete"], button:has-text("Cancelar")').last();
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigate(): Promise<void> {
    await this.page.goto(ROUTES.products);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async navigateToCreateProduct(): Promise<void> {
    await this.page.goto(ROUTES.productEdit);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async navigateToEditProduct(productId: string): Promise<void> {
    await this.page.goto(`${ROUTES.productEdit}?id=${productId}`);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  // ============================================================================
  // List Actions
  // ============================================================================

  async clickCreateProduct(): Promise<void> {
    await this.createProductButton.click();
    await this.page.waitForURL(/produtos\/editar/, { timeout: TIMEOUTS.navigation });
  }

  async searchProduct(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async getProductCount(): Promise<number> {
    if (await this.hasProducts()) {
      return await this.productRow.count();
    }
    return 0;
  }

  async hasProducts(): Promise<boolean> {
    return await this.productsTable.isVisible();
  }

  async hasEmptyState(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  // ============================================================================
  // Product Actions
  // ============================================================================

  async editProduct(index: number = 0): Promise<void> {
    await this.editButton.nth(index).click();
    await this.page.waitForURL(/produtos\/editar/, { timeout: TIMEOUTS.navigation });
  }

  async deleteProduct(index: number = 0): Promise<void> {
    await this.deleteButton.nth(index).click();
    await this.confirmDialog.waitFor({ state: "visible", timeout: TIMEOUTS.apiResponse });
  }

  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton.click();
    await this.page.waitForTimeout(1000); // Wait for deletion
  }

  async cancelDelete(): Promise<void> {
    await this.cancelDeleteButton.click();
    await this.confirmDialog.waitFor({ state: "hidden", timeout: TIMEOUTS.apiResponse });
  }

  async duplicateProduct(index: number = 0): Promise<void> {
    await this.duplicateButton.nth(index).click();
    await this.page.waitForTimeout(1000); // Wait for duplication
  }

  // ============================================================================
  // Form Actions
  // ============================================================================

  async fillProductName(name: string): Promise<void> {
    await this.productNameInput.fill(name);
  }

  async fillProductDescription(description: string): Promise<void> {
    await this.productDescriptionInput.fill(description);
  }

  async fillProductPrice(price: string): Promise<void> {
    await this.productPriceInput.fill(price);
  }

  async uploadProductImage(filePath: string): Promise<void> {
    await this.productImageInput.setInputFiles(filePath);
  }

  async saveProduct(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(2000); // Wait for save operation
  }

  async cancelEdit(): Promise<void> {
    await this.cancelButton.click();
    await this.page.waitForURL(/produtos$/, { timeout: TIMEOUTS.navigation });
  }

  /**
   * Complete product creation flow
   */
  async createProduct(name: string, description: string, price: string): Promise<void> {
    await this.fillProductName(name);
    await this.fillProductDescription(description);
    await this.fillProductPrice(price);
    await this.saveProduct();
  }

  // ============================================================================
  // Tab Navigation
  // ============================================================================

  async switchToGeneralTab(): Promise<void> {
    await this.generalTab.click();
    await this.page.waitForTimeout(500);
  }

  async switchToCheckoutTab(): Promise<void> {
    await this.checkoutTab.click();
    await this.page.waitForTimeout(500);
  }

  async switchToMembersAreaTab(): Promise<void> {
    await this.membersAreaTab.click();
    await this.page.waitForTimeout(500);
  }

  async switchToAffiliatesTab(): Promise<void> {
    await this.affiliatesTab.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================================================
  // State Checks
  // ============================================================================

  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible().catch(() => false);
  }

  async hasSuccessMessage(): Promise<boolean> {
    return await this.successMessage.isVisible().catch(() => false);
  }

  async hasErrorMessage(): Promise<boolean> {
    return await this.errorMessage.isVisible().catch(() => false);
  }

  async getSuccessMessageText(): Promise<string> {
    if (await this.hasSuccessMessage()) {
      return await this.successMessage.textContent() ?? "";
    }
    return "";
  }

  async getErrorMessageText(): Promise<string> {
    if (await this.hasErrorMessage()) {
      return await this.errorMessage.textContent() ?? "";
    }
    return "";
  }

  async isFormValid(): Promise<boolean> {
    const isSaveEnabled = await this.saveButton.isEnabled();
    return isSaveEnabled;
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForProductsLoad(): Promise<void> {
    await Promise.race([
      this.productsTable.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad }),
      this.emptyState.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad }),
    ]);
  }

  async waitForFormReady(): Promise<void> {
    await this.productNameInput.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
    await this.saveButton.waitFor({ state: "visible" });
  }

  async waitForSaveComplete(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.loadingSpinner.waitFor({ state: "hidden", timeout: TIMEOUTS.formSubmit }).catch(() => {});
  }
}
