const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "kq61pnd4x4r5",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "yYdVRkp-N8MrAvNGAhKvZhPHhV-PvJSbzlgVFmk77q0",
});

//variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");
const emptyCartText = document.querySelector(".cart h2");
// cart
let cart = [];
let buttonsDOM = [];

// getting the products
class Products {
  async getProducts() {
    try {
      //getting the products from contentful
      let contentful = await client.getEntries({
        content_type: "comfyHouseProduct",
      });
      // let data = await (await fetch("products.json")).json();

      let products = contentful.items;
      products = products.map((product) => {
        const { title, price } = product.fields;
        const { id } = product.sys;
        const image = product.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// display products
class UI {
  displayProducts(products) {
    console.log(products);
    let result = "";
    products.forEach((product) => {
      result += `
         <!-- ---------Single Product----------- -->
         <article class="product">
          <div class="img-container">
            <img
              src=${product.image}
              alt="product-img"
              class="product-img"
            />
            <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i> add to cart
            </button>
          </div>
          <h3>${product.title}</h3>
          <h4>$${product.price}</h4>
        </article>
         <!-- ---------End of Single Product----------- -->
         `;
    });
    productsDOM.innerHTML = result;
  }
  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;

    buttons.forEach((button) => {
      let id = button.dataset.id;
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.disabled = true;
        button.innerText = " Item added";
      } else {
        button.addEventListener("click", (event) => {
          event.target.innerText = "";
          event.target.disabled = true;
          event.target.innerText = " Item added";
          // get product from products local storage
          let cartItem = { ...Storage.getProduct(id), amount: 1 };
          // add product to the cart
          cart = [...cart, cartItem];
          // save cart in local storage
          Storage.saveCart(cart);
          // set cart values
          this.setCartValues(cart);
          // display cart items
          this.addCartItem(cartItem);
          // show the cart
          this.showCart();
        });
      }
    });
  }

  // set cart values in total amount and number of cart items
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `<img src=${item.image} />
            <div>
              <h4>${item.title}</h4>
              <h5>$${item.price}</h5>
              <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
              <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <p class="item-amount">${item.amount}</p>
              <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>`;
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }
  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }

  // initial cart items
  populateCart(cart) {
    cart.forEach((item) => {
      this.addCartItem(item);
    });
  }

  //hide cart on close button click
  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }

  cartLogic() {
    clearCartBtn.addEventListener("click", () => {
      localStorage.setItem("cart", []);
      cart = [];
      this.setCartValues(cart);
      Storage.saveCart(cart);
      buttonsDOM.forEach((button) => {
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i> add to cart`;
      });
      while (cartContent.children.length > 0) {
        cartContent.removeChild(cartContent.children[0]);
      }
      this.hideCart();
    });

    // gets the click event on the cart content div
    cartContent.addEventListener("click", (event) => {
      //event.target gets the element thats is being clicked on
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;

        //to remove it from the dom
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id); // to remove it from the local storage
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);

        //tempItem only reference to the cart element
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);

        //tempItem only reference to the cart element
        tempItem.amount = tempItem.amount - 1;

        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }
  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i> add to cart`;
  }
  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}

// localstorage
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  // get product from products
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }

  // save cart in local storage
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  //get cart items initially
  static getCart() {
    let cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  //setup app
  ui.setupAPP();
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
