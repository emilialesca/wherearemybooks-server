const express = require('express');
const mysql = require('mysql');
const util = require('util'); //necesario para trabajar con async await
const cors = require('cors');

const app = express();
const PORT = process.env.PORT ? process.env.PORT : 3001;

app.use(express.json());
app.use(cors());


const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wherearemybooks'
});

conexion.connect();
const qy = util.promisify(conexion.query).bind(conexion); // declaro como voy a llamar a la funcion async await

//CATEGORIA
//POST/categoria - recibe nombre retorna 200 {id, nombre}, 413 {'errores'}

app.post('/api/categoria', async (req, res) => {
    try {
        const nombre = req.body.nombre.toUpperCase().trim();
        //Valido que envien correctamente la info:
        if (!nombre) {
            throw new Error("Falta enviar el nombre");
        }
        //Consulto si la categoria ya es existente:
        let query = "SELECT nombre FROM categoria WHERE nombre = ?";
        let respuesta = await qy(query, [nombre]);

        if (respuesta.length > 0) {
            throw new Error("Esa categoria ya existe");
        }

        //Guardo la nueva categoria:
        query = "INSERT INTO categoria (nombre) VALUE (?)";
        respuesta = await qy(query, [nombre]);

        //Envio la info:
        res.send(respuesta);
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

//GET/categoria - retorna 200 [{id, nombre}], 413 y []

app.get("/api/categoria", async (req, res) => {
    try {
        const query = "SELECT * FROM categoria";

        const respuesta = await qy(query);

        //res.send({ "respuesta": respuesta });
        res.json(respuesta);
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

//GET/categoria/:id - retorna 200 {id, nombre}, 413 {'errores'}

app.get('/api/categoria/:id', async (req, res) => {
    try {
        let query = 'SELECT * FROM categoria WHERE id = ?';
        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length == 0) {
            throw {
                message: 'La categoría no existe.',
                status: 413
            }
        }

        res.json(respuesta);
        console.log('Operación realizada de manera correcta, sin errores.')
        res.status(200);

    } catch (e) {
        if (e.status == null) {
            res.status(413).send({ "Error": "Error inesperado." });
        }

        console.error('No encontrado.');
        res.status(413).send({ "Error": e.message });
    }
});

app.put('/api/categoria/:id', async (req, res) => {
    try {

        const consulta = await qy('SELECT * FROM categoria WHERE id=?', [req.params.id]);

        if (consulta.length == 1) {
            if (!req.body.nombre ) {
                throw new Error('Todos los campos son requeridos.');
            }

            const nombre = req.body.nombre.toUpperCase().trim();

            await qy('UPDATE categoria SET nombre=? WHERE id=?', [nombre, req.params.id]);
            const respuesta = await qy('SELECT * FROM categoria WHERE id=?', [req.params.id]);
            res.send(respuesta[0]);
        }
        else {
            throw new Error('La categoria que intenta modificar no se encuentra en la base de datos.');
        }
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});


//DELETE/categoria/:id - retorna 200 y {'se borro correctamente}, 413 {'errores}

app.delete('/api/categoria/:id', async (req, res) => {
    try {
        let query = 'SELECT * FROM libro WHERE categoria_id = ?';

        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length > 0) {
            throw {
                message: 'La categoria tiene libros asociados. NO se puede ELIMINAR.',
                status: 413
            }
        }

        query = 'SELECT * FROM categoria WHERE id = ?';

        respuesta = await qy(query, [req.params.id]);

        if (respuesta.length == 0) {
            throw {
                message: 'No existe la categoría indicada.',
                status: 413
            }
        }

        query = 'DELETE FROM categoria WHERE id = ?';

        respuesta = await qy(query, [req.params.id]);

        res.send({ "respuesta": 'La categoría se eliminó correctamente' });
        console.log('Operación realizada de manera correcta, sin errores.')
        res.status(200);

    } catch (e) {
        /*if (e.status == null) {
            res.status(413).send({ "Error": "Error inesperado." });
        }*/

        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});


//PERSONA
//POST/persona - recibe {nombre, apellido, alias, email} retorna 200 {id, nombre, apellido, alias, email} 413 {'errores'}

app.post("/api/persona", async (req, res) => {
    try {
        const nombre = req.body.nombre.toUpperCase().trim();
        const apellido = req.body.apellido.toUpperCase().trim();
        const alias = req.body.alias.toUpperCase().trim();
        const email = req.body.email.toUpperCase().trim();

        if (!nombre || !apellido || !alias || !email) {
            throw new Error('Todos los campos deben ser completados.');
        }
        let email_check = await qy('SELECT email FROM persona WHERE email = ?', [email])

        if (email_check.length > 0) {
            throw new Error("El e-mail proporcionado ya se encuentra en uso.");
        }

        const respuesta = await qy('INSERT into persona (nombre, apellido, alias, email) values (?, ?, ?, ?)', [nombre, apellido, alias, email]);
        const registroInsertado = await qy('SELECT * FROM persona WHERE id=?', [respuesta.insertId]);
        res.send(registroInsertado[0]);
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

//GET/persona - retorna 200 [{id, nombre, apellido, alias, email}], 413 y []

app.get('/api/persona', async (req, res) => {
    try {
        const respuesta = await qy('select * from persona');
        res.json(respuesta);
    }
    catch (e) {
        res.status(413).send({ "Error": e.message });
        console.error(e.message);
    }
});

//GET/persona/:id - retorna 200 {id, nombre, apellido, alias, email}, 413 {'errores}

app.get('/api/persona/:id', async (req, res) => {
    try {
        const respuesta = await qy('select * from persona where id=?', [req.params.id]);
        console.log(respuesta)
        if (!respuesta.length > 0) {
            throw new Error('No se encuentra esa persona');
        }
        res.json(respuesta[0]);

    } catch (e) {
        res.status(413).send({ "Error": e.message });
        console.log(e.message);
    }
});

app.get('/api/librosprestados/:id', async (req, res) => {
    try {
        const respuesta = await qy('select * from libro where persona_id=?', [req.params.id]);
        console.log(respuesta)
        if (!respuesta.length > 0) {
            throw new Error('No se encuentran libros prestados');
        }
        res.send(respuesta);

    } catch (e) {
        res.status(413).send({ "Error": e.message });
        console.log(e.message);
    }
});

app.get('/api/libroscategoria/:id', async (req, res) => {
    try {
        const respuesta = await qy('select * from libro where categoria_id=?', [req.params.id]);
        console.log(respuesta)
        if (!respuesta.length > 0) {
            throw new Error('No se encuentran libros asociados');
        }
        res.send(respuesta);

    } catch (e) {
        res.status(413).send({ "Error": e.message });
        console.log(e.message);
    }
});

//PUT/persona/:id - recibe {nombre, apellido, alias, email} no se puede modificar email, retorna 200 {y el objeto modificado}, 413 {'errores'}

app.put('/api/persona/:id', async (req, res) => {
    try {

        const consulta = await qy('SELECT * FROM persona WHERE id=?', [req.params.id]);

        if (consulta.length == 1) {
            if (!req.body.nombre || !req.body.apellido || !req.body.alias || !req.body.email) {
                throw new Error('Todos los campos son requeridos.');
            }
            let newEmail = await qy('SELECT email FROM persona WHERE id = ?', [req.params.id]);

            const email = req.body.email.toUpperCase().trim();

            if (email != newEmail[0].email) {
                throw new Error('No se puede modificar el e-mail.');
            }

            const nombre = req.body.nombre.toUpperCase().trim();
            const apellido = req.body.apellido.toUpperCase().trim();
            const alias = req.body.alias.toUpperCase().trim();


            await qy('UPDATE persona SET nombre=?, apellido=?, alias=?, email=? WHERE id=?', [nombre, apellido, alias, email, req.params.id]);
            const respuesta = await qy('SELECT * FROM persona WHERE id=?', [req.params.id]);
            res.send(respuesta[0]);
        }
        else {
            throw new Error('La persona que intenta modificar no se encuentra en la base de datos.');
        }
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
        
    }
});

//DELETE/persona/:id - retorna 200 {'se borro correctamente'}, 413 {'errores'}

app.delete('/api/persona/:id', async (req, res) => {
    try {
        const registro = await qy('SELECT * FROM persona WHERE id=?', [req.params.id]);
        if (registro.length == 1) {
            const consulta = await qy('SELECT persona_id FROM libro WHERE persona_id=?', [req.params.id]);
            if (consulta.length == 0) {
                await qy('DELETE FROM persona WHERE id=?', [req.params.id]);
                res.json('La persona seleccionada se borró exitosamente.');
            }
            else {
                throw new Error('La persona que intenta eliminar tiene uno o más libros asociados.');
            }
        }
        else {
            throw new Error('La persona que intenta eliminar no se encuentra en la base de datos.');
        }
    }
    catch (e) {
        console.error(e.message);
        //res.status(413).send({ "Error": e.message });
        //res.status(413).send({"Error": e.message});
        res.status(413).send({"Error": e.message});
    }
});



//LIBRO
//POST/libro - recibe {nombre, descripcion, categoria_id, persona_id}, retorna 200 {id, nombre, descripcion, categoria, categoria_id, persona_id}, 413 {'errores'}

app.post('/api/libro', async (req, res) => {
    try {
        if (!req.body.nombre || !req.body.categoria_id) {
            throw new Error('nombre y categoria son datos obligatorios');
        }
        if (!req.body.descripcion) {
            throw new Error('Faltan enviar datos');
        }
        const nombre = req.body.nombre.toUpperCase().trim();
        const descripcion = req.body.descripcion.toUpperCase().trim();
        let consulta = 'SELECT id FROM libro WHERE nombre = ?';
        let respuesta = await qy(consulta, [nombre]);

        if (respuesta.length > 0) {
            throw new Error('Ese libro ya existe');
        }


        consulta = 'SELECT * FROM categoria WHERE id=?';
        respuesta = await qy(consulta, [req.body.categoria_id]);

        if (!respuesta.length > 0) {
            throw new Error('No existe esa categoria');
        }

        if (req.body.persona_id != null && req.body.persona_id != 0) {
            consulta = 'SELECT * FROM persona WHERE id = ?';
            respuesta = await qy(consulta, [req.body.persona_id]);
            if (respuesta.length == 0) {
                throw new Error('no existe la persona indicada');
            }
        }

        //guardo nuevo libro
        consulta = 'INSERT INTO libro (nombre, descripcion, categoria_id, persona_id) VALUES (?, ?, ?, ?)';
        respuesta = await qy(consulta, [nombre, descripcion, req.body.categoria_id, req.body.persona_id]);

        const datosInsertados = await qy('SELECT * FROM libro WHERE id = ?', [respuesta.insertId]);
        res.send(datosInsertados);
        // res.status(200).send({"mensaje":"Se ha grabado correctamente"});

    } catch (e) {
        if (e.message != 'No existe esa categoria' && e.message != 'Faltan enviar datos' && e.message != 'no existe la persona indicada'
            && e.message != 'nombre y categoria son datos obligatorios' && e.message != 'Ese libro ya existe') {
            res.status(413).send({ "Error": "error inesperado" })
            //return;
        }
        res.status(413).send({ "Error": e.message });

    }
});

//GET/libro - retorna 200 [{id, nombre, descripcion, categoria_id, persona_id}], 413 {'errores'}

app.get('/api/libro', async (req, res) => {
    try {
        //const respuesta = await qy('SELECT libro.id, libro.nombre, libro.descripcion, libro.categoria_id, libro.persona_id, categoria.nombre as nombre_categoria, persona.alias as alias FROM `libro` LEFT JOIN `categoria` ON categoria.id = libro.categoria_id LEFT JOIN persona ON persona.id = libro.persona_id');
        const respuesta = await qy('SELECT libro.id, libro.nombre, libro.descripcion, libro.categoria_id, libro.persona_id, persona.alias as alias FROM `libro` LEFT JOIN persona ON persona.id = libro.persona_id');
        console.log(respuesta);
        //res.send({ "respuesta": respuesta });
        res.json(respuesta);
        
    } catch (e) {
        console.error(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

//GET/libro/:id - retorna 200 {id, nombre, descripcion, categoria_id, persona_id}, 413 {'errores'}

app.get('/api/libro/:id', async (req, res) => {
    try {

        const respuesta = await qy('SELECT libro.id, libro.nombre, libro.descripcion, libro.categoria_id, libro.persona_id, categoria.nombre as nombre_categoria, persona.alias as alias FROM libro LEFT JOIN categoria ON categoria.id = libro.categoria_id LEFT JOIN persona ON persona.id = libro.persona_id  WHERE libro.id = ?', [req.params.id]);
        //const respuesta = await qy('SELECT * FROM libro WHERE id = ?', [req.params.id]);
        if (respuesta.length == 0) {
            throw new Error('No se encuentra ese libro');
        } else {
            //res.send({ "respuesta": respuesta });
            res.json(respuesta);
        }

    } catch (e) {
        if (e.message != 'No se encuentra ese libro') {
            res.status(413).send({ "Error": "error inesperado" });
        }
        res.status(413).send({ "Error": e.message });
    }

});

//PUT/libro/:id - recibe {id, nombre, descripcion, categoria_id, persona_id}, retorna 200 {id, nombre, descripcion, categoria_id, persona_id}modificado, 413 {'errores'}

app.put('/api/libro/:id', async (req, res) => {
    try {
        const descripcion = req.body.descripcion.toUpperCase().trim();

        let query = 'SELECT nombre, categoria_id, persona_id FROM libro WHERE id = ?';

        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length == 0) {
            throw {
                message: 'No se encuentra ese libro.',
                status: 404
            }
        }

        if ((respuesta[0].nombre != req.body.nombre.toUpperCase().trim()) || (respuesta[0].categoria_id != req.body.categoria_id) || (respuesta[0].persona_id != req.body.persona_id)) {
            throw {
                message: 'Sólo se puede modificar la descripción del libro.',
                status: 404
            }
        }

        query = 'UPDATE libro SET descripcion = ? WHERE id = ?';

        respuesta = await qy(query, [descripcion, req.params.id]);

        const registroInsertado = await qy('SELECT * FROM libro WHERE id=?', [req.params.id]);

        res.json(registroInsertado);
        console.log('Operación realizada de manera correcta, sin errores.')

    } catch (e) {
        if (e.status == null) {
            res.status(500).send({ "Error": "Error inesperado." });
        }

        console.error(e.message);
        res.status(e.status).send({ "Error": e.message });
    }
});

//PUT/libro/prestar/:id - recibe:{id, persona_id}, retorna 200 y {'se presto correcamente}

app.put('/api/libro/prestar/:id', async (req, res) => {
    try {

        let query = 'SELECT * FROM libro WHERE id=?';
        let respuesta = await qy(query, [req.params.id]);

        if (!respuesta.length > 0) {
           /* throw {
                name: "bookDoesNotExist",
                message: "No se encontro el libro"
            }*/
            throw new Error("No se encontro el libro")
        }
        // la concha de tu madre all boys

        query = 'SELECT persona_id FROM libro WHERE id=?';
        respuesta = await qy(query, [req.params.id]);

        console.log(respuesta[0].persona_id)
        if (respuesta[0].persona_id > 0) {
            /*throw  {
                name: "libroPrestado",
                message: "El libro ya se encuentra prestado, no se puede prestar hasta que no se devuelva"
            }*/
            throw new Error("El libro ya se encuentra prestado, no se puede prestar hasta que no se devuelva")
        }

        query = 'SELECT * FROM persona WHERE id=?';
        respuesta = await qy(query, [req.body.persona_id]);

        if (!respuesta.length > 0) {
            /*throw {
                name: "personaNotFound",
                message: "No se encontro la persona a la que se quiere prestar el libro"
            }*/
            throw new Error("No se encontro la persona a la que se quiere prestar el libro")
        }

        query = 'UPDATE libro SET persona_id = (?) WHERE id=?';
        respuesta = await qy(query, [req.body.persona_id, req.params.id]);

        res.json('Se presto correctamente');


    }
    catch (e) {
        if (["personaNotFound", "libroPrestado", "bookDoesNotExist"].includes(e.name)) {

            res.status(413).send({ 'Error': e.message });
            console.log(e.message);
        }
        res.status(413).send({'Error': e.message});
    }
});

//PUT/libro/devolver/:id - retorna 200

app.put('/api/libro/devolver/:id', async (req, res) => {
    try {

        let query = 'SELECT * FROM libro WHERE id=?';
        let respuesta = await qy(query, [req.params.id]);

        if (!respuesta.length > 0) {
            /*throw {
                name: "bookDoesNotExist",
                message: "Ese libro no existe"
            }*/
            throw new Error("Ese libro no existe")
        }
        query = 'SELECT persona_id FROM libro WHERE id=?'
        respuesta = await qy(query, [req.params.id]);

        if (!respuesta[0].persona_id > 0) {
            /*throw {
                name: "libroEnStock",
                message: "Ese libro no estaba prestado"
            }*/
            throw new Error("Ese libro no estaba prestado")
        }

        query = 'UPDATE libro SET persona_id = (null) WHERE id = ?';
        respuesta = await qy(query, [req.params.id]);
        console.log(respuesta);

        res.status(200).send('Se realizo la devolucion correctamente');



    }
    catch (e) {
        if (["bookDoesNotExist", "libroEnStock"].includes(e.name)) {

            res.status(413).send({ 'Error': e.message });
            console.log(e.message);
        }

        res.status(413).send({ "Error": e.message });


    }
});

//DELETE/libro/:id - retorna 200 {'se borro correctamente}, 413 {'errores'}

app.delete('/api/libro/:id', async (req, res) => {
    try {
        let query = 'SELECT * FROM libro WHERE id = ?';

        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length == 0) {
            throw {
                message: 'No se encuentra ese libro.',
                status: 413
            }
        }

        query = 'SELECT persona_id FROM libro WHERE id = ?';

        respuesta = await qy(query, [req.params.id]);

        if (respuesta[0].persona_id != null) {
            throw {
                message: 'Ese libro está prestado, NO se puede borrar.',
                status: 413
            }
        }

        query = 'DELETE FROM libro WHERE id = ?';

        respuesta = await qy(query, [req.params.id]);

        res.send({ "respuesta": 'El libro se eliminó correctamente' });
        console.log('Operación realizada de manera correcta, sin errores.')
        res.status(200);

    } catch (e) {
        if (e.status == null) {
            res.status(413).send({ "Error": "Error inesperado." });
        }

        console.error(e.message);
        res.status(e.status).send({ "Error": e.message });
    }
});


app.listen(PORT, () => {
    console.log('App corriendo en el puerto ', PORT);
});

// Integrantes:---

// Lucas Aranguren
// María Emilia Lesca
// Ignacio Garcia
// Sofía Cacace
// Emmanuel Galera
// Daniel Flores