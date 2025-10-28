package usecase

import (
	"context"
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/domain/repository"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/jwt"
)

type AuthUseCase struct {
	userRepo   repository.UserRepository
	jwtManager *jwt.Manager
}

func NewAuthUseCase(userRepo repository.UserRepository, jwtManager *jwt.Manager) *AuthUseCase {
	return &AuthUseCase{
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

func (uc *AuthUseCase) Login(ctx context.Context, username, password string) (string, error) {
	user, err := uc.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return "", entity.ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", entity.ErrInvalidCredentials
	}

	token, err := uc.jwtManager.Generate(user.Username, user.Role)
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	return token, nil
}

func (uc *AuthUseCase) Register(ctx context.Context, username, password string, role entity.Role) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user := &entity.User{
		Username: username,
		Password: string(hashedPassword),
		Role:     role,
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}
