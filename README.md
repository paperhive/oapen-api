# Development

```
DATABASE_URL="postgres://USER:PASSWORD@localhost:5555/DATABASENAME" DATABASE_SSL=false nodemon
```

# Postgres DB via Docker

```
sudo docker pull postgres:9.4
```

```
sudo docker run -p 5555:5432 --name postgres -e POSTGRES_PASSWORD=mysecretpassword -d postgres:9.4
```


```
sudo docker exec -it postgres psql -U postgres
```