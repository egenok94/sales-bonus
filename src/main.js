/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity} = purchase;

   return sale_price * quantity * (1 - (discount / 100));
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.1;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    } 

    // @TODO: Проверка наличия опций
     const { calculateRevenue, calculateBonus } = options;

     typeof calculateRevenue === "function";

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id:seller.id,
        name: seller.first_name + " " + seller.last_name,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        bonus: 0,
    }
   // Заполним начальными данными
    )); 

    // @TODO: Индексация продавцов и товаров для быстрого доступа]

    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item])); // Ключом будет id, значением — запись из sellerStats

    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (seller) {
            seller.sales_count += 1;
            seller.revenue += record.total_amount - record.total_discount;
        }

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateSimpleRevenue(item);
            seller.profit += revenue - cost;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            } 
            
            seller.products_sold[item.sku] += item.quantity;
        })
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => {
        if (a.profit > b.profit) {
            return -1
        } 
        if(a.profit < b.profit) {
            return 1;
        }
        return 0;  
    })


    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);

        seller.products_sold = Object.entries(seller.products_sold);

        seller.top_products = seller.products_sold
            .map(product => {
                return {
                    sku: product[0],
                    quantity: product[1]
                }
            })
            .sort((a, b) => {
                if (a.quantity > b.quantity) {
                    return -1
                } 
                if(a.quantity < b.quantity) {
                    return 1;
                }

                return 0;
            
            })
            .slice(0, 10);
    })


    

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id, // Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2),// Число с двумя знаками после точки, бонус продавца
})); 

}
