# Payments Microservice

- --- Creamos el proyecto
  - -- Con ncil
    - run: `nest new payments-ms `

- --- Inicia como un RESTful API
  - -- Se lo crea con nest cli
    - run:  `nest g res payments --no-spec`


- --- DTO validators:
  - -- Install deps
    - runs: `pnpm add class-validator class-transformer`
  - -- Config validator global pipe
    - en el `main.ts`








## Stripe
- --- Iniciamos por la creacion de una Cuenta en Stripe
  - -- En este caso uso mi correo para la cuenta de prueba
    - `sss@sss.ss`
      ```sh
          # url developers to get STRIPE_SECRET_KEY
          https://dashboard.stripe.com/test/apikeys

          # url stripe sdk - server side
          https://docs.stripe.com/libraries#server-side-libraries

      ```


- --- `SDK de stripe`
  - -- Para interactuar con Stripe vamos a hacer uso de su SDK
    - run: `pnpm add stripe`


- --- Webhooks de Stripe
  - -- Raw body: lo requiere stripe, esto lo configuramos en el `main.ts`
    ```sh
        # url developers webhooks
        https://dashboard.stripe.com/test/webhooks

        # test in local - hay q instalar cosas, q pereza :v
        https://dashboard.stripe.com/test/webhooks/create?endpoint_location=local

    ```








## Hybrid
- --- Dado q el Webhook de Stripe debe comunicarse x REST con nuestro microservice de Payments, se opta x manejar un Hibrido entre Microservicio y RESTful API
  - -- Se podria implementar otras soluciones, como q se comunique solo con el API Gateway y este con el de payment, o tal vez otra cosa, pero esta es la q ecogio FH
    - Entonces mantendremos el RESTful API
    - Y ademas Comunicacion x  NATS  con los demas microservices




- --- Instalamos el transporter y configuramos el hibrido
  - -- Microservice: Install Nats y la dep de us
    - run: `pnpm add @nestjs/microservices nats`

  - -- Configuramos el hybrid en el `main.ts`
    - Cuando es 1 hybrid en Nest.js NOOO se comparten los settings
      - No se comparten guards, global pipes, etc., amenos q se coloque manualmente en e main.ts
      ```ts
          // https://docs.nestjs.com/faq/hybrid-application#sharing-configuration
           { inheritAppConfig: true },
      ```

  - -- Para el Microservice, llego al PaymentSession a travez de la creacion de la Orden
    - `Orden` >> createOrder >>> `Payment` (createPaymentSession)
      - Asi se haria la comunicacion entre order-ms y payment-ms q este ultimo interactua con Stripe
        - Luego el webhook recibe el succeded payment de stripe xq exponemos ese puerto q consume stripe directo al ms
        - NATS entre microservices para las req q entran x el Gateway
          - Webhook x el Hybrid q si exponemos ese endpoint para q llegue directo al payment-ms, no a travez del API Gateway
    - Esto, hasta este punto sucede con MessagePattern
      - Donde pido y espero respuesta para continuar
      
    
#### EventPatter in PaymentsMS
- --- Configurar PaymentsMS q ahora es un Hybrid (Rest and MS) para q use el `EventPattern`
  - -- Esto puesto q stripe notifica al Webhook cuando se hizo el pago y de ahi se desentiende, no espera response ni nada d nuestra parte
    - X eso nosotros, cuando llama al webhook con succeded payment, lanzamos 1 Evento al MS de Orders para q cambie el state de la orden

- --- EventPatter:
  - -- Creamos el transport module para tener el NAST module
    - run: `nest g mo nats`
      - El dir lo renombramos a transports y el module si lo dejamos tal cual
  - -- Importamos el NatsModule en donde se utilice, en los imports
    - Asi :v
      ```sh
        @Module({
          imports: [NatsModule],
          controllers: [PaymentsController],
          providers: [PaymentsService],
        })
        export class PaymentsModule {}
      ```

  - -- En el `stripeWebhook` EMITIMOS 1 evento `payment.succeeded` q `order-ms` estara escuchando para cambiar el estado de la orden a pagada y ademas guardara la data especifica de stripe q creamos conveniente guardar
    - -- Flujo:
      ```ruby
        OrderMS > PaymentMS > Stripe > Webhook (PaymentMS) > Publish Event > OrderMS

        # 1. Gateway HTTP init
        OrderMS (request) > PaymentMS < StripeSession (payment link - response)
        Succeded Payment (Stripe) > Webhook (PaymentMS) > Publish Event > OrderMS (upd tables, custom logic)
      ```
      - El flujo Inicia con la creacion de la orden de compra q viene a traves del Gateway, esto x NATS lo lleva al OrderMS q lo lleva al PaymentMS, q se comunica con Stripe para q nos d el PaymentSession, y en esta misma Reques, nos devuelve el enlace de Pago q nos da stripe en el PaymentSession
        - En ese Link de pago, tras pagar correctamente, Stripe se comunica con nuestro webhook q exponemos directo, no a travez del Gateway, y cuado nos notifica al webhook el payment.succeded, EMITIMOS 1 evento en el PaymentMS notificado ese payment.succeeded con el payload q nos interese de lo q nos envia stripe en el chargeSucceeded `this.client.emit('payment.succeeded', payload);`
          - A aste evento esta subscrito nuestro OrderMS q cuando lo escucha cambia el estado de la orden (match orden creacion q inicia todo, q fue a la metadata a stripe, con las q tengo en db) respectiva a pagada y demas logica q creamos conveniete
          - Recordar q los EVENTOS solo se publican y alguien escucha, NO se espera respuesta




- --- Almacenar la DB el succeded payment
  - -- En el Payment Microservice `EMITO` el evento `payment.succeeded`
    - Al cual esta subscrito el `orders-ms` asi:
      - Recordar q los eventos NO esperan respuesta, emipes o publicas y te desentiendes
      ```ts
        // // EventPattern: no return required/wanted
        @EventPattern('payment.succeeded')
        paidOrder(@Payload() paidOrderDto: PaidOrderDto) {
          this.ordersService.markOrderAsPaid(paidOrderDto);
        }
      ```

    - Entonces, cuando el webhook llama a nuestro endpoint del hybrid payment-ms, este EMITE el evento 'payment.succeeded' para q el `orders-ms` haga el upd a la db de la orden q inicio toda la movida
      - Cambia state, y crea el registro de OrderReceipt
        - No manejamos desde afuera la @Transaction xq al tener relacion, la @Transaction se maneja x debajo, es asi q si la insercion fall, se hace rollback de todo
      - Como es `EventPatter` no espera respuesta, asi q NO lanzo nada





