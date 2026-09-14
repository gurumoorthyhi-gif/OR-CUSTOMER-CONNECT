"""Product pricing persistence."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import SessionFactory, session_scope
from app.modules.products.models import (
    DiscountRule,
    PriceRule,
    Product,
    ProductCategory,
    TaxConfiguration,
)


class ProductRepository:
    def __init__(self, factory: SessionFactory, organization_id: int | None = None) -> None:
        self.factory = factory
        self.organization_id = organization_id

    def _scoped(self, statement, model):
        if self.organization_id is not None:
            statement = statement.where(model.organization_id == self.organization_id)
        return statement

    def create_category(self, name: str) -> ProductCategory:
        with session_scope(self.factory) as session:
            category = ProductCategory(name=name, organization_id=self.organization_id)
            session.add(category)
            session.flush()
            return category

    def list_categories(self) -> list[ProductCategory]:
        with session_scope(self.factory) as session:
            statement = self._scoped(select(ProductCategory), ProductCategory).order_by(
                ProductCategory.name
            )
            return list(session.scalars(statement))

    def get_category(self, category_id: int) -> ProductCategory | None:
        with session_scope(self.factory) as session:
            return session.scalar(
                self._scoped(
                    select(ProductCategory).where(ProductCategory.id == category_id),
                    ProductCategory,
                )
            )

    def create_product(self, **values) -> Product:
        with session_scope(self.factory) as session:
            product = Product(organization_id=self.organization_id, **values)
            session.add(product)
            session.flush()
            product_id = product.id
        reloaded = self.get(product_id)
        if reloaded is None:
            raise RuntimeError("Product could not be reloaded")
        return reloaded

    def get(self, product_id: int) -> Product | None:
        with session_scope(self.factory) as session:
            return session.scalar(
                self._scoped(select(Product).where(Product.id == product_id), Product)
                .options(selectinload(Product.price_rules), selectinload(Product.category))
            )

    def list_products(self, query: str = "") -> list[Product]:
        with session_scope(self.factory) as session:
            statement = self._scoped(select(Product), Product).options(
                selectinload(Product.category)
            )
            if query:
                statement = statement.where(
                    Product.code.ilike(f"%{query}%") | Product.name.ilike(f"%{query}%")
                )
            return list(session.scalars(statement.order_by(Product.name)))

    def add_price_rule(self, product_id: int, minimum: Decimal, unit_price: Decimal) -> PriceRule:
        with session_scope(self.factory) as session:
            rule = session.scalar(
                select(PriceRule).where(
                    PriceRule.product_id == product_id,
                    PriceRule.minimum_quantity == minimum,
                )
            )
            if rule is None:
                rule = PriceRule(
                    product_id=product_id,
                    minimum_quantity=minimum,
                    unit_price=unit_price,
                )
                session.add(rule)
            else:
                rule.unit_price = unit_price
            session.flush()
            return rule

    def list_discounts(self) -> list[DiscountRule]:
        with session_scope(self.factory) as session:
            return list(
                session.scalars(
                    self._scoped(select(DiscountRule), DiscountRule)
                    .where(DiscountRule.is_active.is_(True))
                    .order_by(DiscountRule.minimum_subtotal.desc())
                )
            )

    def add_discount(
        self, name: str, minimum_subtotal: Decimal, percentage: Decimal
    ) -> DiscountRule:
        with session_scope(self.factory) as session:
            rule = session.scalar(
                self._scoped(select(DiscountRule).where(DiscountRule.name == name), DiscountRule)
            )
            if rule is None:
                rule = DiscountRule(name=name, organization_id=self.organization_id)
                session.add(rule)
            rule.minimum_subtotal = minimum_subtotal
            rule.percentage = percentage
            rule.is_active = True
            session.flush()
            return rule

    def add_tax(self, name: str, percentage: Decimal) -> TaxConfiguration:
        with session_scope(self.factory) as session:
            tax = session.scalar(
                self._scoped(
                    select(TaxConfiguration).where(TaxConfiguration.name == name),
                    TaxConfiguration,
                )
            )
            if tax is None:
                tax = TaxConfiguration(name=name, organization_id=self.organization_id)
                session.add(tax)
            tax.percentage = percentage
            tax.is_active = True
            session.flush()
            return tax
