package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	hash, _ := bcrypt.GenerateFromPassword([]byte("12345677"), bcrypt.DefaultCost)
	fmt.Println(string(hash))
}
