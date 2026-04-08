package com.absensi.karyawan.model

data class LocationResult(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float?,
    val address: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

sealed class UiState<out T> {
    object Idle : UiState<Nothing>()
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
