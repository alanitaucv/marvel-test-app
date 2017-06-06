function post_confirm(params) {
	 const id = params.service_id;
	 let servicio = Service.find(id);

   if (servicio===NULL) return {error: '3'};

	 if (servicio.status_id == '6') return {error: '2'};

	 if (servicio.driver_id === NULL && servicio.status_id == '1') {
       //Update carro
			 servicio = Service.update(id, {
    			 driver_id: params.driver_id,
    			 status_id: '2'
			 });

       //Update Driver
			 Driver.update(params.driver_id, { available: '0' });

			 driverTmp = Driver.find(params.driver_id);
       //Update carro
			 Service.update(id, { car_id: driverTmp.car_id });

			 //Notificar a usuario!!
			 var pushMessage = "Tu servicio ha sido confirmado!";
			 servicio = Service.find(id);
			 push = Push.make();

			 if (servicio.user.uuid == '') return {error: '0'};

			 if (servicio.user.type == '1') {//iPhone
				  push.ios(servicio.user.uuid, pushMessage, 1, 'honk.wav', 'Open', {service_id: service.id});
			 } else {
				  push.android2(servicio.user.uuid, pushMessage, 1, 'default', 'Open', {service_id: service.id});
			 }
			 return {error: '0'};
		}
    return {error: '1'};
};
